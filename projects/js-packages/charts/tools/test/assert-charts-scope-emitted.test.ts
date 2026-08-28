import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { assertChartsScopeEmitted } from '../assert-charts-scope-emitted';

const CATALOG =
	':where(.a8c-charts-scope){--a8c-charts-color-grid:var(--wpds-color-stroke-surface-neutral,#dbdbdb)}';

const PAINT =
	':where(.a8c-charts-scope) .visx-rows line.visx-line,:where(.a8c-charts-scope) .visx-columns line.visx-line{stroke:var(--a8c-charts-color-grid)}';

const BUILT = `${ CATALOG }${ PAINT }`;

const distWith = ( css: string ): string => {
	const dir = mkdtempSync( join( tmpdir(), 'charts-scope-guard-' ) );
	writeFileSync( join( dir, 'index.css' ), css );

	return dir;
};

describe( 'assertChartsScopeEmitted', () => {
	it( 'passes on output carrying the provider-scoped catalog', () => {
		expect( () => assertChartsScopeEmitted( distWith( BUILT ) ) ).not.toThrow();
	} );

	it( 'fails when the visx paint rules were dropped', () => {
		expect( () => assertChartsScopeEmitted( distWith( CATALOG ) ) ).toThrow( /chart-paint\.scss/ );
	} );

	it( 'fails when no CSS was built at all', () => {
		expect( () =>
			assertChartsScopeEmitted( mkdtempSync( join( tmpdir(), 'charts-empty-' ) ) )
		).toThrow( /was not built/ );
	} );

	it( 'fails when the catalog lost its provider scope', () => {
		expect( () =>
			assertChartsScopeEmitted(
				distWith(
					':root{--a8c-charts-color-grid:var(--wpds-color-stroke-surface-neutral,#dbdbdb)}'
				)
			)
		).toThrow( /:where\(\.a8c-charts-scope\)/ );
	} );

	it( 'fails when the catalog is declared on :root as well', () => {
		expect( () =>
			assertChartsScopeEmitted( distWith( `${ BUILT }\n:root{--a8c-charts-color-grid:red}` ) )
		).toThrow( /":root" catalog block/ );
	} );

	// The guard reads the whole of `dist/index.css`, which carries every stylesheet in the package and any a bundled dependency contributes. Matching a bare `:root` selector would fail the production build on an unrelated rule — with a message blaming the catalog.
	it( 'passes a :root block that declares no charts variable', () => {
		expect( () =>
			assertChartsScopeEmitted( distWith( `${ BUILT }\n:root{--some-other-package-token:12px}` ) )
		).not.toThrow();
	} );

	// Minified output puts `{` directly before the nested selector, with no whitespace for the leading-context class to match on.
	it.each( [
		[ 'a media query', '@media(min-width:1px){:root{--a8c-charts-color-grid:red}}' ],
		[ 'a cascade layer', '@layer base{:root{--a8c-charts-color-grid:red}}' ],
	] )( 'fails when the catalog leaks onto :root inside %s', ( _label, leak ) => {
		expect( () => assertChartsScopeEmitted( distWith( `${ BUILT }\n${ leak }` ) ) ).toThrow(
			/":root" catalog block/
		);
	} );
} );
