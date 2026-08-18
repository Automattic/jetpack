import * as publicApi from '../index';

// `src/index.ts` enumerates its provider exports one by one rather than re-exporting the barrel, so a hook can be documented, shipped inside the bundle, and still be unreachable from `@automattic/charts` — the package exposes no `./providers` subpath to fall back on. These are the provider entry points the docs tell consumers to import.
describe( 'public package exports', () => {
	it.each( [
		'GlobalChartsProvider',
		'useGlobalChartsContext',
		'useGlobalChartsTheme',
		'GlobalChartsContext',
		'defaultTheme',
		// TOKENS.md, AGENTS.md and the provider docs all tell consumers to resolve tokens against this element rather than `document.documentElement`.
		'useChartScopeElement',
	] )( 'exports %s from the package root', name => {
		expect( publicApi ).toHaveProperty( name );
	} );
} );
