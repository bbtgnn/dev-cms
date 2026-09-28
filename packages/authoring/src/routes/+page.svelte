<script lang="ts">
	import { AuthoringApp, type EditorCollections } from "$lib";
	import { createFakeClient } from "../testing/fake-client";

	const { client } = createFakeClient({
		entries: [
			{
				collection: "posts",
				id: "welcome-to-dev-cms",
				revision: "rev-1",
				data: {
					title: "Welcome to Dev CMS",
					summary: "Edit this entry from the package-local preview.",
					body: "The authoring package now doubles as its own SvelteKit reference host.",
					status: "draft",
					featured: true,
					readingTime: 4,
				},
			},
		],
	});

	const collections: EditorCollections = {
		posts: {
			schema: {
				type: "object",
				title: "Post",
				required: ["title", "body", "status"],
				properties: {
					title: { type: "string", title: "Title", minLength: 1 },
					summary: { type: "string", title: "Summary" },
					body: { type: "string", title: "Body" },
					status: {
						type: "string",
						title: "Status",
						enum: ["draft", "review", "published"],
					},
					featured: { type: "boolean", title: "Featured" },
					readingTime: {
						type: "number",
						title: "Reading time",
						minimum: 1,
					},
				},
			},
		},
	};
</script>

<svelte:head>
	<title>Dev CMS authoring preview</title>
	<meta
		name="description"
		content="Package-local preview for the Dev CMS authoring shell"
	/>
</svelte:head>

<div class="preview-shell">
	<header>
		<p class="eyebrow">@cms/authoring</p>
		<h1>Authoring shell preview</h1>
		<p>
			This SvelteKit route exercises the same public component API shipped by the
			package, backed by an in-memory CMS protocol client.
		</p>
	</header>

	<section aria-label="Authoring shell">
		<AuthoringApp {client} {collections} getPreviewUrl={() => null} />
	</section>
</div>

<style>
	.preview-shell {
		width: min(100% - 2rem, 72rem);
		margin-inline: auto;
		padding-block: 3rem;
	}

	header {
		max-width: 46rem;
		margin-bottom: 2rem;
	}

	.eyebrow {
		margin: 0 0 0.5rem;
		color: var(--muted-foreground);
		font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
		font-size: 0.8125rem;
	}

	h1 {
		margin: 0;
		font-size: clamp(2rem, 5vw, 3.5rem);
		letter-spacing: -0.04em;
	}

	header > p:last-child {
		color: var(--muted-foreground);
		line-height: 1.6;
	}

	section {
		min-height: 32rem;
		border: 1px solid var(--border);
		border-radius: var(--radius);
		background: var(--card);
		padding: clamp(1rem, 3vw, 2rem);
		box-shadow: 0 1.25rem 4rem color-mix(in oklab, var(--foreground) 8%, transparent);
	}
</style>
