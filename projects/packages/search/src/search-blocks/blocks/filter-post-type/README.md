# Post Type Scope — `jetpack-search/filter-post-type`

> Author-configured filter that constrains Jetpack Search results to a fixed set of post types — or removes specific post types. Configured in the editor; renders nothing on the front end.

<!-- screenshot placeholder -->

The Post Type Scope block is a **silent constraint** block. It has no visible front-end output. Instead, `render.php` writes an `include`/`exclude` constraint into the shared `jetpack-search` Interactivity API state (`state.staticPostTypes`). Every search request the store issues will respect this constraint, filtering the result set to only (or away from) the configured post types before displaying results.

This block is distinct from using the `post_type` variation of `jetpack-search/filter-checkbox`, which surfaces post-type filtering as a visitor-facing checkbox list. Use `filter-post-type` when you want to silently limit or exclude post types without exposing the filter to visitors.

The block is server-rendered (`render.php`) and has no visible front-end markup.

---

## Attributes

| Name | Type | Default | Description |
|------|------|---------|-------------|
| `mode` | `string` (`"include"` \| `"exclude"`) | `"exclude"` | Whether the `postTypes` list is an allowlist (`include` — only these post types appear) or a denylist (`exclude` — these post types are hidden). |
| `postTypes` | `string[]` | `[]` | Array of post-type slugs to include or exclude. When empty, the block has no effect. |

---

## Block relationships

Intended child of `jetpack-search/filters`. Multiple instances of this block can coexist; `Filter_Post_Type::merge_state()` merges their constraints into a single `staticPostTypes` object in the store. Has no InnerBlocks of its own.

---

## Minimum example markup

```html
<!-- wp:jetpack-search/filter-post-type /-->
```

Include only `post` and `page`:

```html
<!-- wp:jetpack-search/filter-post-type {"mode":"include","postTypes":["post","page"]} /-->
```

Exclude `attachment`:

```html
<!-- wp:jetpack-search/filter-post-type {"mode":"exclude","postTypes":["attachment"]} /-->
```

---

## Rendering notes

- **Server-rendered** via `render.php`. The renderer calls `Filter_Post_Type::build_constraint()` to derive an `{ include: string[], exclude: string[] }` object, then calls `wp_interactivity_state()` to write or deep-merge it into `state.staticPostTypes`.
- **No markup is emitted.** The block's sole job is to inject store state; the results store reads `staticPostTypes` when building Elasticsearch query filters.
- Requires `wp_interactivity_state()` (available since WP 6.5); skips silently on older cores.
- When both `include` and `exclude` are empty the block exits without touching the store state.
