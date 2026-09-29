import { defineConfig } from "tsdown";
import { buildEntries } from "./package-entries.ts";

export default defineConfig({
	entry: [...buildEntries],
	outDir: "dist",
	dts: true,
	format: ["esm"],
	platform: "neutral",
	// package.json deps are already external; keep node: builtins out of the bundle.
	deps: {
		neverBundle: ["zod", "pathe", /^node:/],
	},
	unbundle: true,
});
