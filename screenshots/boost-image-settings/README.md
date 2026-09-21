# Modern image settings

Desktop (1280 px), mobile (782 px), RTL and LCP state captures from the isolated Docker site with SCRIPT_DEBUG false and production assets.

The comparison images place the design reference beside the implementation. Existing copy, quality limits and actions are retained. All three wells use the neutral surface, weak neutral stroke, extra-small border width and large radius tokens. The collapsed quality header has 16 px padding above and below; the expanded controls start 16 px below it. Pending Optimize has 0.5 opacity.

## Legacy verification

Baseline: 6e52c4f82637db036a58fd6934ad45e1fc640194.

At 1280 and 782 px, rendered `.jb-dashboard` HTML is byte-identical between matching baseline and changed production builds (no normalization required). Both screenshot pairs have zero differing pixels. Tall viewports include the nested scrolling content. Modern classes and labels select only the row surface; legacy output and shared translated strings are preserved.

## Checks

- 446 JavaScript tests pass, including the named auto-resize toggle, four LCP states, Optimize action, expandable issues notice and three default legacy surface regressions.
- TypeScript, ESLint, Stylelint and production build pass.
- Manually checked not-analyzed, pending, analyzed, error, analyzed-with-issues, quality expanded/collapsed, auto-resize saving and Lossless disabling sliders.
- Local Image CDN/LCP e2e setup was waived after environment failures. Both feature specs passed CI on the preceding head. PHP tests and Phan are deferred to CI; no PHP source changed.
- `bin/check` is absent from this checkout; project checks were used.
