# Powered by Jetpack — `jetpack-search/powered-by`

> Attribution link to jetpack.com.

<!-- screenshot placeholder -->

The Powered by Jetpack block renders a small colophon linking to the Jetpack Search upgrade page. **Free-plan sites must always display this attribution**; `jetpack-search/search-results` enforces this by automatically appending the block if it is missing from the panel at render time. Paid-plan authors can remove or hide the block freely.

The block is server-rendered (`render.php`) and has no JavaScript view module.

---

## Attributes

This block exposes no custom attributes. Styling is controlled through the standard block-supports UI (color, spacing, typography).

---

## Block relationships

Intended child of `jetpack-search/search-results`. Typically placed at the bottom of the results panel. If absent from the serialised inner block HTML on a free-plan site, `search-results/render.php` appends a server-rendered instance automatically.

---

## Minimum example markup

```html
<!-- wp:jetpack-search/powered-by /-->
```

---

## Rendering notes

- **Server-rendered** via `render.php`. No JavaScript view module — the block outputs static HTML only.
- The attribution URL is locale-aware: for non-English locales, the URL prefix is set to the two-letter language code (e.g., `https://fr.jetpack.com/upgrade/search?utm_source=poweredby`).
- The Jetpack logo SVG uses a hard-coded brand-green fill (`#069E08`) regardless of any color-support overrides applied to the block.
