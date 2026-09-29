import { describe, expect, test } from "bun:test";
import { publicEntries as astroEntries, binSrc } from "../packages/astro/package-entries.ts";
import { publicEntries as coreEntries } from "../packages/core/package-entries.ts";
import {
	assertPackageFace,
	distExportsFromSrcMap,
	srcToDistPath,
} from "./package-face.ts";

describe("package face", () => {
	test("maps ts / astro / svelte sources to dist targets", () => {
		expect(srcToDistPath("./src/index.ts")).toBe("./dist/index.js");
		expect(srcToDistPath("./src/host/shell-page.astro")).toBe(
			"./dist/host/shell-page.astro",
		);
		expect(srcToDistPath("./src/host/cms-mount.svelte")).toBe(
			"./dist/host/cms-mount.svelte",
		);
	});

	test("core live exports match the entry map", () => {
		assertPackageFace({
			label: "@cms/core",
			exports: distExportsFromSrcMap(coreEntries),
			publicEntries: coreEntries,
		});
	});

	test("astro live exports and bin match the entry map", () => {
		assertPackageFace({
			label: "@cms/astro",
			exports: distExportsFromSrcMap(astroEntries),
			publicEntries: astroEntries,
			bin: { cms: "./dist/cli.js" },
			binSrc,
		});
	});

	test("rejects drifted export targets", () => {
		expect(() =>
			assertPackageFace({
				label: "@cms/core",
				exports: { ".": "./dist/wrong.js" },
				publicEntries: { ".": "./src/index.ts" },
			}),
		).toThrow('expected ./dist/index.js, got ./dist/wrong.js');
	});
});
