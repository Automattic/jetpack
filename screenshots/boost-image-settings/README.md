# Modern image settings

Desktop (1280 px), mobile (782 px), RTL, Lossless and LCP state captures from the isolated Docker site with SCRIPT_DEBUG false.

The comparison images place the design reference beside the implementation. Existing copy, quality limits and actions are retained. The quality panel reuses CollapsibleMeta and the inset surface follows the Cache log card's design tokens.

## Legacy verification

Baseline: 6e52c4f82637db036a58fd6934ad45e1fc640194.

At 1280 and 782 px, the rendered `.jb-dashboard` HTML was byte-identical between the baseline and changed builds (no normalization was necessary). Both screenshot pairs have zero differing pixels. Captures use tall viewports to include the page's nested scrolling content. Modern classes and labels are selected only on the row surface; existing legacy output and shared translated strings are preserved.

## Checks

- 441 JavaScript tests passed, including the named auto-resize toggle, four LCP states, Optimize action and expandable issues notice.
- TypeScript and style checks passed.
- Manually checked not-analyzed, pending, analyzed, error, analyzed-with-issues, quality expanded/collapsed, auto-resize saving and Lossless disabling the slider.
- Local Image CDN/LCP e2e setup could not register the Jetpack WP-CLI command; the local run was waived. PHP tests and Phan could not complete with the local runners and are deferred to CI. No PHP source changed.
- `bin/check` is absent from this checkout; the project checks above were used.
