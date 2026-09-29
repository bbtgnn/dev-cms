import { describe, expect, test } from "bun:test";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import path from "node:path";
import {
	assertPublishFace,
	createPublishFace,
	type PackageJson,
} from "./publish-face-contract.ts";

const workspacePackage: PackageJson = {
	name: "@cms/example",
	private: true,
	exports: {
		".": "./src/index.ts",
		"./shell": "./src/shell.svelte",
		"./page.astro": "./src/page.astro",
	},
	bin: { cms: "./src/cli.ts" },
	dependencies: { "@cms/core": "workspace:*", zod: "catalog:" },
	devDependencies: { typescript: "catalog:" },
	scripts: { check: "tsc" },
};

function publishFace(): PackageJson {
	return createPublishFace(workspacePackage, {
		packageName: "@cms/example",
		catalog: { zod: "^4.0.0" },
		workspaceVersion: (name) => (name === "@cms/core" ? "0.1.0" : ""),
		svelteCondition: true,
	});
}

describe("publish face contract", () => {
	test("derives consumer metadata from the workspace manifest", () => {
		expect(publishFace()).toMatchObject({
			private: false,
			files: ["dist"],
			exports: {
				".": {
					types: "./dist/index.d.ts",
					import: "./dist/index.js",
					svelte: "./dist/index.js",
				},
				"./shell": { svelte: "./dist/shell.svelte" },
				"./page.astro": { import: "./dist/page.astro" },
			},
			bin: { cms: "./dist/cli.js" },
			dependencies: { "@cms/core": "0.1.0", zod: "^4.0.0" },
		});
		expect(publishFace().devDependencies).toBeUndefined();
		expect(publishFace().scripts).toBeUndefined();
	});

	test("rejects a missing staged public target", () => {
		const root = mkdtempSync(path.join("/tmp", "publish-face-contract-"));
		try {
			const dist = path.join(root, "dist");
			mkdirSync(dist);
			for (const file of [
				"index.js",
				"index.d.ts",
				"shell.svelte",
				"page.astro",
			]) {
				writeFileSync(path.join(dist, file), "");
			}
			expect(() => assertPublishFace(dist, publishFace())).toThrow(
				'@cms/example bin "cms": missing staged target ./dist/cli.js',
			);
		} finally {
			rmSync(root, { recursive: true, force: true });
		}
	});

	test("maps a conventional SvelteKit library source directory to dist root", () => {
		const pkg = createPublishFace(
			{
				name: "@cms/authoring",
				exports: {
					".": "./src/lib/index.ts",
					"./config": "./src/lib/config/index.ts",
				},
			},
			{
				packageName: "@cms/authoring",
				catalog: {},
				workspaceVersion: () => "",
				sourceDir: "src/lib",
				svelteCondition: true,
			},
		);

		expect(pkg.exports).toEqual({
			".": {
				types: "./dist/index.d.ts",
				import: "./dist/index.js",
				svelte: "./dist/index.js",
			},
			"./config": {
				types: "./dist/config/index.d.ts",
				import: "./dist/config/index.js",
				svelte: "./dist/config/index.js",
			},
		});
	});

	test("accepts workspace condition maps when every condition targets one source", () => {
		const pkg = createPublishFace(
			{
				name: "@cms/authoring",
				exports: {
					".": {
						types: "./src/lib/index.ts",
						svelte: "./src/lib/index.ts",
						default: "./src/lib/index.ts",
					},
				},
			},
			{
				packageName: "@cms/authoring",
				catalog: {},
				workspaceVersion: () => "",
				sourceDir: "src/lib",
				svelteCondition: true,
			},
		);

		expect(pkg.exports).toEqual({
			".": {
				types: "./dist/index.d.ts",
				import: "./dist/index.js",
				svelte: "./dist/index.js",
			},
		});
	});

	test("preserves standard dist exports for a prebuilt Svelte library", () => {
		const exports = {
			".": {
				types: "./dist/index.d.ts",
				svelte: "./dist/index.js",
				default: "./dist/index.js",
			},
		};
		const pkg = createPublishFace(
			{
				name: "@cms/authoring",
				private: true,
				exports,
			},
			{
				packageName: "@cms/authoring",
				catalog: {},
				workspaceVersion: () => "",
				distExports: true,
			},
		);

		expect(pkg.exports).toEqual(exports);
		expect(pkg.private).toBe(false);
	});

	test("preserves live dist export maps and dist bins while rewriting deps", () => {
		const exports = {
			".": "./dist/index.js",
			"./shell-page.astro": "./dist/host/shell-page.astro",
		};
		const live: PackageJson = {
			name: "@cms/astro",
			private: true,
			exports,
			bin: { cms: "./dist/cli.js" },
			dependencies: { "@cms/core": "workspace:*", zod: "catalog:" },
			devDependencies: { typescript: "catalog:" },
			scripts: { build: "tsdown" },
		};
		const staged = createPublishFace(live, {
			packageName: "@cms/astro",
			catalog: { zod: "^4.0.0" },
			workspaceVersion: (name) => (name === "@cms/core" ? "0.1.0" : ""),
			distExports: true,
		});

		expect(staged.exports).toEqual(live.exports);
		expect(staged.bin).toEqual({ cms: "./dist/cli.js" });
		expect(staged.dependencies).toEqual({
			"@cms/core": "0.1.0",
			zod: "^4.0.0",
		});
		expect(staged.devDependencies).toBeUndefined();
		expect(staged.scripts).toBeUndefined();
		expect(staged.private).toBe(false);
		expect(staged.files).toEqual(["dist"]);
	});

	test("live and staged dist targets resolve to the same artifacts", () => {
		const root = mkdtempSync(path.join("/tmp", "publish-face-live-staged-"));
		try {
			const dist = path.join(root, "dist");
			mkdirSync(path.join(dist, "host"), { recursive: true });
			for (const file of ["index.js", "cli.js", "host/shell-page.astro"]) {
				writeFileSync(path.join(dist, file), "");
			}
			const exports = {
				".": "./dist/index.js",
				"./shell-page.astro": "./dist/host/shell-page.astro",
			};
			const live: PackageJson = {
				name: "@cms/astro",
				exports,
				bin: { cms: "./dist/cli.js" },
				dependencies: { zod: "catalog:" },
			};
			const staged = createPublishFace(live, {
				packageName: "@cms/astro",
				catalog: { zod: "^4.0.0" },
				workspaceVersion: () => "",
				distExports: true,
			});
			expect(staged.exports).toEqual(live.exports);
			expect(staged.bin).toEqual(live.bin);
			expect(() => assertPublishFace(dist, live)).not.toThrow();
			expect(() => assertPublishFace(dist, staged)).not.toThrow();
		} finally {
			rmSync(root, { recursive: true, force: true });
		}
	});
});
