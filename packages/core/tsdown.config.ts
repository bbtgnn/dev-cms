import { defineConfig } from "tsdown";

/** Build inputs stay independent of the consumer export map (ADR-0027). */
const entry = [
	"./src/index.ts",
	"./src/define-cms/define-cms.ts",
	"./src/protocol/fetch-client.ts",
	"./src/form-tree/form-tree.ts",
	"./src/http/index.ts",
	"./src/node.ts",
	"./src/protocol/protocol.ts",
	"./src/semantic/index.ts",
];

export default defineConfig({
	entry,
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
