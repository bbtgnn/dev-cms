/**
 * Copy non-TS runtime assets into dist.
 * tsdown `copy` runs on full builds; watch mode may not re-copy, so
 * `watch:assets` owns subsequent updates.
 */
import { copyFileSync, mkdirSync, watch } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { copyAssets } from "../package-entries.ts";

const pkgRoot = path.resolve(
	fileURLToPath(new URL(".", import.meta.url)),
	"..",
);

const ASSETS = copyAssets.map((from) => {
	const relative = from.replace(/^\.\//, "");
	const toRelative = relative.replace(/^src\//, "dist/");
	return {
		from: path.join(pkgRoot, relative),
		to: path.join(pkgRoot, toRelative),
		basename: path.basename(relative),
	};
});

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
			const changed = ASSETS.some((asset) => asset.basename === filename);
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
