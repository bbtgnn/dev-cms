/**
 * Bounded watch-rebuild smoke: starts a fixture watcher in a temp tree,
 * mutates an input, waits for the output to change, then cleans up.
 * Isolated from developer package sources.
 */
import { describe, expect, test } from "bun:test";
import { spawn } from "node:child_process";
import {
	mkdtempSync,
	readFileSync,
	rmSync,
	statSync,
	writeFileSync,
} from "node:fs";
import path from "node:path";
import { killChild } from "./dev-supervisor.ts";

async function waitFor(
	predicate: () => boolean,
	timeoutMs = 10_000,
): Promise<void> {
	const deadline = Date.now() + timeoutMs;
	while (Date.now() < deadline) {
		if (predicate()) return;
		await Bun.sleep(40);
	}
	throw new Error("timed out waiting for condition");
}

describe("package watch rebuild smoke", () => {
	test("fixture watcher rewrites output after an input change", async () => {
		const root = mkdtempSync(path.join("/tmp", "watch-rebuild-smoke-"));
		const input = path.join(root, "input.txt");
		const output = path.join(root, "output.txt");
		writeFileSync(input, "v1");
		writeFileSync(output, "stale");

		// Polling copy mirrors package watchers without relying on fs.watch
		// semantics (unreliable across platforms for this smoke).
		const watcher = path.join(root, "watch.js");
		writeFileSync(
			watcher,
			`import { copyFileSync, readFileSync } from "node:fs";
const input = ${JSON.stringify(input)};
const output = ${JSON.stringify(output)};
let last = "";
while (true) {
	const next = readFileSync(input, "utf8");
	if (next !== last) {
		copyFileSync(input, output);
		last = next;
	}
	await Bun.sleep(40);
}
`,
		);

		const child = spawn("bun", [watcher], {
			cwd: root,
			stdio: "ignore",
			detached: process.platform !== "win32",
		});

		try {
			await waitFor(() => readFileSync(output, "utf8") === "v1");
			const before = statSync(output).mtimeMs;
			writeFileSync(input, "v2");
			await waitFor(() => {
				try {
					return (
						readFileSync(output, "utf8") === "v2" &&
						statSync(output).mtimeMs >= before
					);
				} catch {
					return false;
				}
			});
			expect(readFileSync(output, "utf8")).toBe("v2");
		} finally {
			killChild(child);
			await new Promise<void>((resolve) => {
				child.once("exit", () => resolve());
				setTimeout(resolve, 1_000);
			});
			rmSync(root, { recursive: true, force: true });
		}
	}, 15_000);
});
