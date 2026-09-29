import { defineConfig } from "tsdown";

/**
 * Build inputs stay independent of the consumer export map (ADR-0027).
 * Public export sources plus runtime-only entries resolved via import.meta.url,
 * Vite path inject, or package bin.
 */
const entry = [
	"./src/index.ts",
	"./src/host/config.ts",
	"./src/collection-types.ts",
	"./src/content-proxy/index.ts",
	"./src/testing.ts",
	"./src/host/middleware-entry.ts",
	"./src/host/protocol-route.ts",
	"./src/cli.ts",
	"./src/host/default-host.ts",
	"./src/stamped/shell-form-models.ts",
	"./src/content-proxy/shims/astro-loaders.ts",
	"./src/content-proxy/shims/astro-content-sync.ts",
];

export default defineConfig({
	entry,
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
	copy: [
		{ from: "src/host/shell-page.astro", to: "dist/host" },
		{ from: "src/host/cms-mount.svelte", to: "dist/host" },
		{ from: "src/virtual-modules.d.ts", to: "dist" },
	],
});
