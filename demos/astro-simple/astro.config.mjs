import svelte from "@astrojs/svelte";
import { cms } from "@cms/astro";
import { defineConfig } from "astro/config";

// https://astro.build/config
export default defineConfig({
	integrations: [svelte(), cms()],
	vite: {
		ssr: {
			// Linked workspace @cms/* stay in Vite SSR for dist rebuild HMR.
			// `astro` keeps assets/fonts virtuals out of Node native ESM.
			noExternal: [/^@cms\//, "astro"],
		},
		optimizeDeps: {
			// Linked package HMR: do not prebundle @cms/* or Vite freezes rebuilt dist.
			exclude: ["@cms/astro", "@cms/authoring", "@cms/core"],
		},
	},
});
