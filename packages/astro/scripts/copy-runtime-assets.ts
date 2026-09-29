/**
 * Copy non-TS runtime assets into dist.
 * tsdown `copy` runs on full builds; watch mode may not re-copy, so
 * `watch:assets` owns subsequent updates.
 */
import { copyFileSync, mkdirSync, watch } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const pkgRoot = path.resolve(
	fileURLToPath(new URL(".", import.meta.url)),
	"..",
);

const ASSETS = [
	{
		from: path.join(pkgRoot, "src/host/shell-page.astro"),
		to: path.join(pkgRoot, "dist/host/shell-page.astro"),
	},
	{
		from: path.join(pkgRoot, "src/host/cms-mount.svelte"),
		to: path.join(pkgRoot, "dist/host/cms-mount.svelte"),
	},
	{
		from: path.join(pkgRoot, "src/virtual-modules.d.ts"),
		to: path.join(pkgRoot, "dist/virtual-modules.d.ts"),
	},
] as const;

export function copyRuntimeAssets(): void {
	for (const asset of ASSETS) {
		mkdirSync(path.dirname(asset.to), { recursive: true });
		copyFileSync(asset.from, asset.to);
	}
}

function watchRuntimeAssets(): void {
	copyRuntimeAssets();
	const watched = new Set(ASSETS.map((asset) => path.dirname(asset.from)));
	for (const dir of watched) {
		watch(dir, { persistent: true }, (_event, filename) => {
			if (!filename) return;
			const changed = ASSETS.some(
				(asset) => path.basename(asset.from) === filename,
			);
			if (changed) copyRuntimeAssets();
		});
	}
}

if (import.meta.main) {
	if (process.argv.includes("--watch")) {
		watchRuntimeAssets();
	} else {
		copyRuntimeAssets();
	}
}
