/**
 * Assert live package.json exports/bin match package-entries.ts (ADR-0027).
 * Usage: bun run scripts/assert-package-face.ts @cms/core | @cms/astro
 */
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { assertPackageFace } from "./package-face.ts";

const root = path.resolve(fileURLToPath(new URL(".", import.meta.url)), "..");

const packages = {
	"@cms/core": {
		dir: "packages/core",
		entries: () => import("../packages/core/package-entries.ts"),
	},
	"@cms/astro": {
		dir: "packages/astro",
		entries: () => import("../packages/astro/package-entries.ts"),
	},
} as const;

type PackageName = keyof typeof packages;

function isPackageName(name: string): name is PackageName {
	return name in packages;
}

async function main(name: PackageName): Promise<void> {
	const cfg = packages[name];
	const entries = await cfg.entries();
	const pkg = JSON.parse(
		readFileSync(path.join(root, cfg.dir, "package.json"), "utf8"),
	) as {
		exports?: unknown;
		bin?: unknown;
	};
	assertPackageFace({
		label: name,
		exports: pkg.exports,
		publicEntries: entries.publicEntries,
		bin: pkg.bin,
		binSrc: "binSrc" in entries ? entries.binSrc : undefined,
	});
}

const name = process.argv[2];
if (!name || !isPackageName(name)) {
	console.error(
		`Usage: bun run scripts/assert-package-face.ts <${Object.keys(packages).join("|")}>`,
	);
	process.exit(1);
}
await main(name);
