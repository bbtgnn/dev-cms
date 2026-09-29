---
status: accepted
---

# Watched `dist/` is the only consumer-visible package face

Workspace reference hosts and packed consumers both resolve built `dist/`
exports for `@cms/core`, `@cms/authoring`, and `@cms/astro`. Package source
stays idiomatic to its own toolchain (including authoring `$lib/shadcn`);
builders own source-to-`dist` transformation. Root development commands own
process orchestration: seed `dist/`, then run package watchers alongside the
selected reference host.

**Why not keep workspace-source exports (#39 / PR #38):** authoring is a
SvelteKit library with package-local `$lib` aliases. SvelteKit resolves `$lib`
in the active application, so a reference host cannot safely consume another
package's raw source containing that alias. Pointing only authoring at `dist/`
left a mixed face (core/astro on `src/`, authoring on `dist/`) and made refresh
depend on which package changed. One watched `dist/` face matches the publish
contract and keeps self-host validation honest.

**Rejected:** rewriting authoring source to drop `$lib`; teaching reference
hosts package-internal aliases; exposing `src/` for some packages and `dist/`
for others.

Supersedes the source-workspace decision captured by #39 and PR #38. Does not
change public APIs, package ownership ([ADR-0018](0018-three-packages-for-adr-0008-layers.md)),
or publish-to-registry work (#34).
