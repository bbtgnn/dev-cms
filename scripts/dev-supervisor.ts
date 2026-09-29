/**
 * Cross-platform supervisor for reference-host `dev*` commands.
 *
 * Seeds package `dist/` outputs, runs the selected host's dependency-closure
 * watchers, then starts the host. Owns child lifecycle: signals, failure
 * propagation, and no orphan watchers (ADR-0027).
 */
import {
	type ChildProcess,
	type SpawnOptions,
	spawn,
} from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(fileURLToPath(new URL(".", import.meta.url)), "..");

export type ProcSpec = {
	readonly name: string;
	readonly cwd: string;
	readonly cmd: readonly string[];
};

export type HostName = "simple" | "overlay" | "kit";

export type SpawnFn = (
	command: string,
	args: readonly string[],
	options: SpawnOptions,
) => ChildProcess;

export type SupervisorPlan = {
	readonly seed: readonly ProcSpec[];
	readonly watchers: readonly ProcSpec[];
	readonly host: ProcSpec;
};

const coreSeed: ProcSpec = {
	name: "core:build",
	cwd: "packages/core",
	cmd: ["bun", "run", "build"],
};
const authoringSeed: ProcSpec = {
	name: "authoring:build",
	cwd: "packages/authoring",
	cmd: ["bun", "run", "build:package"],
};
const astroSeed: ProcSpec = {
	name: "astro:build",
	cwd: "packages/astro",
	cmd: ["bun", "run", "build"],
};

const coreWatch: ProcSpec = {
	name: "core:watch",
	cwd: "packages/core",
	cmd: ["bun", "run", "watch"],
};
const authoringStylesWatch: ProcSpec = {
	name: "authoring:styles",
	cwd: "packages/authoring",
	cmd: ["bun", "run", "watch:styles"],
};
const authoringPackageWatch: ProcSpec = {
	name: "authoring:package",
	cwd: "packages/authoring",
	cmd: ["bun", "run", "watch:package"],
};
const astroWatch: ProcSpec = {
	name: "astro:watch",
	cwd: "packages/astro",
	cmd: ["bun", "run", "watch"],
};
const astroAssetsWatch: ProcSpec = {
	name: "astro:assets",
	cwd: "packages/astro",
	cmd: ["bun", "run", "watch:assets"],
};

const kitWatchers = [coreWatch, authoringStylesWatch, authoringPackageWatch];
const astroWatchers = [...kitWatchers, astroWatch, astroAssetsWatch];

export const HOST_PLANS: Record<HostName, SupervisorPlan> = {
	kit: {
		seed: [coreSeed, authoringSeed],
		watchers: kitWatchers,
		host: {
			name: "sveltekit",
			cwd: "demos/sveltekit",
			cmd: ["bun", "run", "dev"],
		},
	},
	simple: {
		seed: [coreSeed, authoringSeed, astroSeed],
		watchers: astroWatchers,
		host: {
			name: "astro-simple",
			cwd: "demos/astro-simple",
			cmd: ["bun", "run", "dev"],
		},
	},
	overlay: {
		seed: [coreSeed, authoringSeed, astroSeed],
		watchers: astroWatchers,
		host: {
			name: "astro-overlay",
			cwd: "demos/astro-overlay",
			cmd: ["bun", "run", "dev"],
		},
	},
};

export function isHostName(value: string): value is HostName {
	return value in HOST_PLANS;
}

export type RunSupervisorOptions = {
	readonly plan: SupervisorPlan;
	readonly rootDir?: string;
	readonly spawnFn?: SpawnFn;
	readonly signal?: AbortSignal;
	/** Override stdio for tests (default inherit). */
	readonly stdio?: SpawnOptions["stdio"];
};

type TrackedChild = {
	readonly name: string;
	readonly child: ChildProcess;
	readonly done: Promise<number>;
};

function resolveCwd(rootDir: string, cwd: string): string {
	return path.isAbsolute(cwd) ? cwd : path.join(rootDir, cwd);
}

function spawnTracked(
	spec: ProcSpec,
	rootDir: string,
	spawnFn: SpawnFn,
	stdio: SpawnOptions["stdio"],
): TrackedChild {
	const [bin, ...args] = spec.cmd;
	if (!bin) throw new Error(`${spec.name}: empty command`);
	const child = spawnFn(bin, args, {
		cwd: resolveCwd(rootDir, spec.cwd),
		stdio,
		env: process.env,
		// Own the process tree so SIGTERM reaches nested package tools.
		detached: process.platform !== "win32",
	});
	const done = new Promise<number>((resolve) => {
		child.once("exit", (code, signal) => {
			if (signal) {
				resolve(signal === "SIGINT" || signal === "SIGTERM" ? 0 : 1);
				return;
			}
			resolve(code ?? 1);
		});
		child.once("error", () => resolve(1));
	});
	return { name: spec.name, child, done };
}

export function killChild(child: ChildProcess): void {
	if (child.killed || child.exitCode != null || child.signalCode != null) {
		return;
	}
	try {
		if (process.platform !== "win32" && child.pid != null) {
			process.kill(-child.pid, "SIGTERM");
			return;
		}
		child.kill("SIGTERM");
	} catch {
		try {
			child.kill("SIGKILL");
		} catch {
			// already gone
		}
	}
}

async function runOneShot(
	spec: ProcSpec,
	rootDir: string,
	spawnFn: SpawnFn,
	stdio: SpawnOptions["stdio"],
): Promise<void> {
	const tracked = spawnTracked(spec, rootDir, spawnFn, stdio);
	const code = await tracked.done;
	if (code !== 0) {
		throw new Error(`${spec.name} failed with exit code ${code}`);
	}
}

/** Seed package outputs then run watchers + host until exit or signal. */
export async function runSupervisor(
	options: RunSupervisorOptions,
): Promise<number> {
	const rootDir = options.rootDir ?? root;
	const spawnFn = options.spawnFn ?? spawn;
	const stdio = options.stdio ?? "inherit";
	const children: TrackedChild[] = [];
	let stopping = false;
	let exitCode = 0;

	const stopAll = (code: number): void => {
		if (stopping) return;
		stopping = true;
		exitCode = code;
		for (const tracked of children) {
			killChild(tracked.child);
		}
	};

	const onAbort = (): void => stopAll(0);
	options.signal?.addEventListener("abort", onAbort, { once: true });

	try {
		for (const spec of options.plan.seed) {
			if (options.signal?.aborted) {
				return 0;
			}
			await runOneShot(spec, rootDir, spawnFn, stdio);
		}

		for (const spec of options.plan.watchers) {
			const tracked = spawnTracked(spec, rootDir, spawnFn, stdio);
			children.push(tracked);
			void tracked.done.then((code) => {
				if (!stopping && code !== 0) {
					stopAll(code);
				}
			});
		}

		const host = spawnTracked(options.plan.host, rootDir, spawnFn, stdio);
		children.push(host);
		void host.done.then((code) => {
			if (!stopping) stopAll(code);
		});

		await Promise.all(children.map((tracked) => tracked.done));
		return exitCode;
	} catch (error) {
		stopAll(1);
		await Promise.all(children.map((tracked) => tracked.done));
		if (error instanceof Error) {
			console.error(error.message);
		}
		return 1;
	} finally {
		options.signal?.removeEventListener("abort", onAbort);
	}
}

if (import.meta.main) {
	const hostArg = process.argv[2];
	if (!hostArg || !isHostName(hostArg)) {
		console.error(
			`Usage: bun run scripts/dev-supervisor.ts <${Object.keys(HOST_PLANS).join("|")}>`,
		);
		process.exit(1);
	}
	const ac = new AbortController();
	const onSignal = (): void => ac.abort();
	process.once("SIGINT", onSignal);
	process.once("SIGTERM", onSignal);
	const code = await runSupervisor({
		plan: HOST_PLANS[hostArg],
		signal: ac.signal,
	});
	process.exit(code);
}
