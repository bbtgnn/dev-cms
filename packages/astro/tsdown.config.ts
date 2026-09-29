import path from "node:path";
import { defineConfig } from "tsdown";
import { buildEntries, copyAssets } from "./package-entries.ts";

export default defineConfig({
	entry: [...buildEntries],
	outDir: "dist",
	dts: true,
	format: ["esm"],
	platform: "node",
	// Publish exports use `.js`; node platform would otherwise emit `.mjs`.
	fixedExtension: false,
	deps: {
		neverBundle: [
			"@cms/core",
			"@cms/authoring",
			"astro",
			"svelte",
			"vite",
			"zod",
			/^node:/,
			/^virtual:/,
			/^astro\//,
		],
	},
	unbundle: true,
	copy: copyAssets.map((from) => {
		const destDir = path.posix.dirname(from.replace(/^\.\/src\//, "dist/"));
		return { from, to: destDir };
	}),
});
