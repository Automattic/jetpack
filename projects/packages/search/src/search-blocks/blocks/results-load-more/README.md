# Load More — `jetpack-search/results-load-more`

> Loads the next page of Jetpack Search results.

<!-- screenshot placeholder -->

The Load More block renders a button that appends the next page of results to the current list when clicked. It is hidden while no search has been performed or when all results have been loaded, and shows a spinner while the next page is being fetched.

The block is server-rendered (`render.php`) and hydrated by `view.js`.

---

## Attributes

| Name | Type | Default | Description |
|------|------|---------|-------------|
| `buttonLabel` | `string` | `""` | The button label text. When empty (or whitespace-only) the translated string `"Load more results"` is used at render time. |

---

## Block relationships

Intended child of `jetpack-search/search-results`. Has no InnerBlocks of its own.

---

## Minimum example markup

```html
<!-- wp:jetpack-search/results-load-more /-->
```

With a custom label:

```html
<!-- wp:jetpack-search/results-load-more {"buttonLabel":"Show more"} /-->
```

---

## Rendering notes

- **Server-rendered** via `render.php`. The wrapper `<div>` is rendered with `hidden` on first paint and is revealed only when `state.showLoadMore` becomes `true` (i.e., there is at least one more page of results), via a `data-wp-bind--hidden` directive.
- The button is hidden while `state.isLoadingMore` is `true` and a spinner is shown in its place, giving instant visual feedback during the next-page fetch.
- The Interactivity API action bound to the button is `actions.loadMore`.
