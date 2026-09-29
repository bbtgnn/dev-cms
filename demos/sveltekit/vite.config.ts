import { sveltekit } from "@sveltejs/kit/vite";
import { defineConfig } from "vite";

export default defineConfig({
	plugins: [sveltekit()],
	ssr: {
		// Linked workspace @cms/* packages must stay in Vite's SSR bundle so
		// rebuilds under dist/ are picked up without a Node native resolve gap.
		noExternal: [/^@cms\//],
	},
	optimizeDeps: {
		// Linked package HMR: do not prebundle @cms/* or Vite freezes rebuilt dist.
		exclude: ["@cms/authoring", "@cms/core"],
	},
	server: {
		fs: {
			allow: ["../.."],
		},
	},
});
