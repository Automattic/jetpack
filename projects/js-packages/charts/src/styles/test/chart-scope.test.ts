import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const stylesheet = readFileSync( join( __dirname, '..', 'chart-scope.module.scss' ), 'utf8' );

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

describe( 'chart scope catalog', () => {
	it.each( EXPECTED_TOKENS )( 'defines %s', token => {
		expect( stylesheet ).toContain( `${ token }:` );
	} );

	it( 'declares custom properties only, so applying the class cannot change layout', () => {
		const body = stylesheet.slice( stylesheet.indexOf( '{' ) + 1, stylesheet.lastIndexOf( '}' ) );
		const declarations = body
			.split( '\n' )
			.map( line => line.trim() )
			.filter( line => line && ! line.startsWith( '//' ) )
			.filter( line => /^[a-z-]+\s*:/i.test( line ) );

		expect( declarations.every( line => line.startsWith( '--a8c-charts-' ) ) ).toBe( true );
	} );
} );
