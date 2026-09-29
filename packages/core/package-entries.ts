/**
 * Source of truth for @cms/core public face + tsdown entries (ADR-0027).
 * Live package.json exports are compact `./dist/*.js` strings derived from this map.
 */
export const publicEntries = {
	".": "./src/index.ts",
	"./define-cms": "./src/define-cms/define-cms.ts",
	"./fetch-client": "./src/protocol/fetch-client.ts",
	"./form-tree": "./src/form-tree/form-tree.ts",
	"./http": "./src/http/index.ts",
	"./node": "./src/node.ts",
	"./protocol": "./src/protocol/protocol.ts",
	"./semantic": "./src/semantic/index.ts",
} as const satisfies Record<string, `./src/${string}.ts`>;

export const buildEntries = Object.values(publicEntries);
