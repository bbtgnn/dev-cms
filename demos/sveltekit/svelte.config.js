import { fileURLToPath } from "node:url";
import adapter from "@sveltejs/adapter-node";
import { vitePreprocess } from "@sveltejs/vite-plugin-svelte";

/** @type {import('@sveltejs/kit').Config} */
const config = {
	preprocess: vitePreprocess(),
	kit: {
		adapter: adapter(),
		alias: {
			// Workspace @cms/authoring exposes source; published output rewrites this alias.
			"$lib/shadcn": fileURLToPath(
				new URL("../../packages/authoring/src/lib/shadcn", import.meta.url),
			),
			$lib: "src/lib",
		},
	},
};

export default config;
