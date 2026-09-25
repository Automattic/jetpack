/// <reference types="node" />
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

// `src/styles/test/chart-scope.test.ts` reads the `.scss` *source*, so it cannot catch the documented failure mode: renaming the stylesheet to `.module.scss` makes `@tsdown/css` mark the generated JS proxy `moduleSideEffects: false` (tree-shakeable unless a class name is read from it), and the catalog's own selector never reads one — it is a `:where()`-wrapped selector, zero CSS-module class names. Rolldown then drops the stylesheet: a green build, a green test suite, and every chart loses its colours. See the import comment in `src/providers/chart-context/global-charts-provider.tsx`.
const MARKERS: Array< { name: string; test: ( css: string ) => boolean } > = [
	{
		name: 'the ":where(.a8c-charts-scope)" selector',
		test: css => css.includes( ':where(.a8c-charts-scope)' ),
	},
	{
		name: 'an unhashed "--a8c-charts-color-grid" declaration',
		test: css => css.includes( '--a8c-charts-color-grid' ),
	},
	// Scoped to a `:root` block that declares a charts variable, not to `:root` anywhere in the file: this runs over the whole of `dist/index.css`, so matching the bare selector would fail the production build on any unrelated `:root` rule the package or a bundled dependency stylesheet happens to add — with a message about the catalog leaking, which would not be what happened.
	{
		name: 'no ":root" catalog block',
		test: css => ! /(^|[\s,}{]):root[^{}]*\{[^}]*--a8c-charts-/.test( css ),
	},
];

/**
 * Fails the build if the built CSS is missing the `--a8c-charts-*` catalog, or the catalog leaked onto `:root` instead of staying scoped to the provider wrapper.
 *
 * @param {string} distDir - The build output directory.
 * @throws {Error} When `dist/index.css` is missing, or a marker check fails.
 */
export function assertChartsScopeEmitted( distDir: string ): void {
	const cssPath = join( distDir, 'index.css' );
	let css: string;

	try {
		css = readFileSync( cssPath, 'utf8' );
	} catch {
		throw new Error(
			`Charts scope guard: ${ cssPath } was not built.\n\n` +
				`The \`--a8c-charts-*\` catalog stylesheet ships only through this file. ` +
				`If the build stopped emitting CSS at all, every chart loses its colours.`
		);
	}

	const failures = MARKERS.filter( marker => ! marker.test( css ) );

	if ( failures.length === 0 ) {
		return;
	}

	throw new Error(
		`Charts scope guard failed on ${ cssPath }:\n` +
			failures.map( marker => `  - missing ${ marker.name }` ).join( '\n' ) +
			`\n\nThe \`--a8c-charts-*\` catalog stylesheet (src/styles/chart-scope.scss) did not ` +
			`reach the build output as expected. A common cause is the stylesheet losing its ` +
			`side-effect status (e.g. being renamed to \`*.module.scss\`), which lets Rolldown ` +
			`tree-shake it away: a green build and a green test suite with no chart colours. ` +
			`See the import comment in src/providers/chart-context/global-charts-provider.tsx.`
	);
}
