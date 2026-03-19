/**
 * Re-export `@wordpress/dataviews` from a single location.
 *
 * In a pnpm monorepo, route packages and the parent forms package may resolve
 * `@wordpress/dataviews` to different physical directories (due to differing peer
 * dependency contexts). When esbuild bundles both copies, each creates its own
 * React context, causing DataViews sub-components (e.g. FiltersToggled) to read
 * from the wrong context.
 *
 * By re-exporting here (inside `src/`), all imports resolve through the forms
 * package's node_modules — collapsing to a single module instance.
 */
export { DataViews } from '@wordpress/dataviews';
export type { View, Field, Action, Operator } from '@wordpress/dataviews';
