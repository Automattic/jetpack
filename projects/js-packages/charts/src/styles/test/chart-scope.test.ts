import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const stylesheet = readFileSync( join( __dirname, '..', 'chart-scope.scss' ), 'utf8' );

const EXPECTED_TOKENS = [
	'--a8c-charts-color-grid',
	'--a8c-charts-color-axis',
	'--a8c-charts-color-tick',
	'--a8c-charts-color-label',
	'--a8c-charts-color-label-secondary',
	'--a8c-charts-color-label-inverse',
	'--a8c-charts-color-label-on-fill',
	'--a8c-charts-color-annotation',
	'--a8c-charts-color-trend-up',
	'--a8c-charts-color-trend-down',
	'--a8c-charts-color-trend-neutral',
	'--a8c-charts-color-background',
	'--a8c-charts-color-surface-secondary',
	'--a8c-charts-color-track',
	'--a8c-charts-color-tooltip-surface',
	'--a8c-charts-color-focus',
	'--a8c-charts-color-zoom-selection',
	'--a8c-charts-color-zoom-selection-stroke',
	'--a8c-charts-elevation-xs',
	'--a8c-charts-elevation-sm',
	'--a8c-charts-border-width-focus',
	'--a8c-charts-motion-duration-series',
	'--a8c-charts-motion-easing-series',
	'--a8c-charts-border-radius-bar',
	'--a8c-charts-border-radius-cell',
	'--a8c-charts-border-radius-leaderboard-bar',
];

/**
 * Splits a declaration block on both newlines and semicolons, so a
 * layout-affecting property appended after a custom property on the
 * same line is inspected separately rather than being hidden inside a
 * single trusted-looking line.
 *
 * @param body - The declaration block, without the surrounding `{ }`.
 * @return The property name (text before `:`) of each declaration.
 */
function extractDeclaredProperties( body: string ): string[] {
	return body
		.split( '\n' )
		.map( line => line.trim() )
		.filter( line => line && ! line.startsWith( '//' ) )
		.join( '\n' )
		.split( ';' )
		.map( declaration => declaration.trim() )
		.filter( declaration => declaration.length > 0 )
		.map( declaration => declaration.slice( 0, declaration.indexOf( ':' ) ).trim() );
}

describe( 'chart scope catalog', () => {
	it.each( EXPECTED_TOKENS )( 'defines %s', token => {
		expect( stylesheet ).toContain( `${ token }:` );
	} );

	it( 'scopes the catalog to :where(.a8c-charts-scope) rather than :root', () => {
		expect( stylesheet ).toMatch( /:where\(\.a8c-charts-scope\)\s*{/ );
		expect( stylesheet ).not.toMatch( /(^|\s):root\s*{/ );
	} );

	it( 'declares custom properties only, so this stylesheet cannot change layout', () => {
		const body = stylesheet.slice( stylesheet.indexOf( '{' ) + 1, stylesheet.lastIndexOf( '}' ) );
		const properties = extractDeclaredProperties( body );

		expect( properties.every( property => property.startsWith( '--a8c-charts-' ) ) ).toBe( true );
	} );

	it( 'rejects a layout declaration appended after a custom property on the same line', () => {
		const fixture =
			'--a8c-charts-color-grid: var(--wpds-color-stroke-surface-neutral, #dbdbdb); display: block;';
		const properties = extractDeclaredProperties( fixture );

		expect( properties.every( property => property.startsWith( '--a8c-charts-' ) ) ).toBe( false );
	} );
} );
