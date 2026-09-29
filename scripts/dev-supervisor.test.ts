import { describe, expect, test } from "bun:test";
import { spawn } from "node:child_process";
import {
	existsSync,
	mkdtempSync,
	readFileSync,
	rmSync,
	writeFileSync,
} from "node:fs";
import path from "node:path";
import {
	HOST_PLANS,
	isHostName,
	killChild,
	runSupervisor,
	type SupervisorPlan,
} from "./dev-supervisor.ts";

function tempDir(prefix: string): string {
	return mkdtempSync(path.join("/tmp", prefix));
}

function writeScript(dir: string, name: string, body: string): string {
	const file = path.join(dir, name);
	writeFileSync(file, body);
	return file;
}

describe("dev supervisor plans", () => {
	test("names every reference-host plan", () => {
		expect(isHostName("kit")).toBe(true);
		expect(isHostName("simple")).toBe(true);
		expect(isHostName("overlay")).toBe(true);
		expect(isHostName("preview")).toBe(false);
		expect(HOST_PLANS.kit.watchers.map((w) => w.name)).toEqual([
			"core:watch",
			"authoring:styles",
			"authoring:package",
		]);
		expect(
			HOST_PLANS.simple.watchers.some((w) => w.name === "astro:assets"),
		).toBe(true);
	});
});

describe("runSupervisor", () => {
	test("seeds before starting the host", async () => {
		const root = tempDir("dev-supervisor-ready-");
		try {
			const orderFile = path.join(root, "order.txt");
			writeFileSync(orderFile, "");
			const seedScript = writeScript(
				root,
				"seed.js",
				`import { appendFileSync } from "node:fs";
appendFileSync(${JSON.stringify(orderFile)}, "seed\\n");
`,
			);
			const hostScript = writeScript(
				root,
				"host.js",
				`import { appendFileSync, readFileSync } from "node:fs";
const order = readFileSync(${JSON.stringify(orderFile)}, "utf8");
if (!order.includes("seed")) process.exit(2);
appendFileSync(${JSON.stringify(orderFile)}, "host\\n");
`,
			);
			const plan: SupervisorPlan = {
				seed: [{ name: "seed", cwd: root, cmd: ["bun", seedScript] }],
				watchers: [],
				host: { name: "host", cwd: root, cmd: ["bun", hostScript] },
			};
			const code = await runSupervisor({
				plan,
				rootDir: root,
				stdio: "ignore",
			});
			expect(code).toBe(0);
			expect(readFileSync(orderFile, "utf8")).toBe("seed\nhost\n");
		} finally {
			rmSync(root, { recursive: true, force: true });
		}
	});

	test("propagates watcher failure and stops the host", async () => {
		const root = tempDir("dev-supervisor-fail-");
		try {
			const hostAlive = path.join(root, "host-alive");
			const failScript = writeScript(
				root,
				"fail.js",
				`await Bun.sleep(50);
process.exit(7);
`,
			);
			const hostScript = writeScript(
				root,
				"host.js",
				`import { writeFileSync } from "node:fs";
writeFileSync(${JSON.stringify(hostAlive)}, "1");
await Bun.sleep(30_000);
`,
			);
			const plan: SupervisorPlan = {
				seed: [],
				watchers: [{ name: "watcher", cwd: root, cmd: ["bun", failScript] }],
				host: { name: "host", cwd: root, cmd: ["bun", hostScript] },
			};
			const code = await runSupervisor({
				plan,
				rootDir: root,
				stdio: "ignore",
			});
			expect(code).toBe(7);
			expect(existsSync(hostAlive)).toBe(true);
		} finally {
			rmSync(root, { recursive: true, force: true });
		}
	});

	test("abort signal stops siblings without leaving orphans", async () => {
		const root = tempDir("dev-supervisor-signal-");
		try {
			const marker = path.join(root, "running");
			const sleepScript = writeScript(
				root,
				"sleep.js",
				`import { writeFileSync } from "node:fs";
writeFileSync(${JSON.stringify(marker)}, String(process.pid));
await Bun.sleep(60_000);
`,
			);
			const plan: SupervisorPlan = {
				seed: [],
				watchers: [{ name: "watcher", cwd: root, cmd: ["bun", sleepScript] }],
				host: { name: "host", cwd: root, cmd: ["bun", sleepScript] },
			};
			const ac = new AbortController();
			const running = runSupervisor({
				plan,
				rootDir: root,
				stdio: "ignore",
				signal: ac.signal,
			});
			const deadline = Date.now() + 5_000;
			while (!existsSync(marker) && Date.now() < deadline) {
				await Bun.sleep(20);
			}
			expect(existsSync(marker)).toBe(true);
			const childPid = Number(readFileSync(marker, "utf8"));
			ac.abort();
			const code = await running;
			expect(code).toBe(0);
			await Bun.sleep(100);
			expect(() => process.kill(childPid, 0)).toThrow();
		} finally {
			rmSync(root, { recursive: true, force: true });
		}
	});

	test("failed seed prevents the host from starting", async () => {
		const root = tempDir("dev-supervisor-seed-fail-");
		try {
			const hostMarker = path.join(root, "host-ran");
			const seedScript = writeScript(root, "seed-fail.js", `process.exit(3);`);
			const hostScript = writeScript(
				root,
				"host.js",
				`import { writeFileSync } from "node:fs";
writeFileSync(${JSON.stringify(hostMarker)}, "1");
`,
			);
			const plan: SupervisorPlan = {
				seed: [{ name: "seed", cwd: root, cmd: ["bun", seedScript] }],
				watchers: [],
				host: { name: "host", cwd: root, cmd: ["bun", hostScript] },
			};
			const code = await runSupervisor({
				plan,
				rootDir: root,
				stdio: "ignore",
			});
			expect(code).toBe(1);
			expect(existsSync(hostMarker)).toBe(false);
		} finally {
			rmSync(root, { recursive: true, force: true });
		}
	});
});

describe("killChild", () => {
	test("terminates a detached sleeping process", async () => {
		const child = spawn("bun", ["-e", "await Bun.sleep(60_000)"], {
			stdio: "ignore",
			detached: process.platform !== "win32",
		});
		expect(child.pid).toBeDefined();
		killChild(child);
		const code = await new Promise<number | null>((resolve) => {
			child.once("exit", (exitCode) => resolve(exitCode));
		});
		expect(code === 0 || code === null).toBe(true);
	});
});
