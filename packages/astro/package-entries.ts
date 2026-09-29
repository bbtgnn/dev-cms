/**
 * Source of truth for @cms/astro public face + tsdown entries (ADR-0027).
 * Live package.json exports are compact `./dist/*` strings derived from this map.
 * Runtime-only entries are built but not exported (bin / dynamic imports).
 */
export const publicEntries = {
	".": "./src/index.ts",
	"./config": "./src/host/config.ts",
	"./collection-types": "./src/collection-types.ts",
	"./content-proxy": "./src/content-proxy/index.ts",
	"./testing": "./src/testing.ts",
	"./middleware-entry": "./src/host/middleware-entry.ts",
	"./protocol-route": "./src/host/protocol-route.ts",
	"./shell-page.astro": "./src/host/shell-page.astro",
	"./cms-mount.svelte": "./src/host/cms-mount.svelte",
} as const satisfies Record<string, `./src/${string}`>;

/** Not in public exports — resolved via bin, import.meta.url, or Vite inject. */
export const runtimeEntries = [
	"./src/cli.ts",
	"./src/host/default-host.ts",
	"./src/stamped/shell-form-models.ts",
	"./src/content-proxy/shims/astro-loaders.ts",
	"./src/content-proxy/shims/astro-content-sync.ts",
] as const satisfies readonly `./src/${string}.ts`[];

export const binSrc = { cms: "./src/cli.ts" } as const;

export const buildEntries = [
	...new Set([
		...Object.values(publicEntries).filter((path) => path.endsWith(".ts")),
		...runtimeEntries,
	]),
];

export const copyAssets = [
	...Object.values(publicEntries).filter(
		(path) => path.endsWith(".astro") || path.endsWith(".svelte"),
	),
	"./src/virtual-modules.d.ts",
] as const;
