import { mergeThemes } from '../../../utils';
import { withCatalogPointers } from '../private/with-catalog-pointers';
import { defaultTheme } from '../themes';
import type { ChartTheme } from '../../../types';

describe( 'withCatalogPointers', () => {
	it( 'restores every overridden role to its catalog pointer, without mutating the input theme', () => {
		const merged = mergeThemes( defaultTheme, {
			backgroundColor: '#111',
			gridStyles: { stroke: '#222' },
			xAxisLineStyles: { stroke: '#333' },
			xTickLineStyles: { stroke: '#444' },
			svgLabelSmall: { fill: '#555' },
			labelBackgroundColor: '#556',
			labelTextColor: '#557',
		} as Partial< ChartTheme > );

		const result = withCatalogPointers( merged, [
			'--a8c-charts-color-background',
			'--a8c-charts-color-grid',
			'--a8c-charts-color-axis',
			'--a8c-charts-color-tick',
			'--a8c-charts-color-label-axis',
			'--a8c-charts-color-label-background',
			'--a8c-charts-color-label-on-fill',
		] );

		expect( result.backgroundColor ).toBe( defaultTheme.backgroundColor );
		expect( result.gridStyles.stroke ).toBe( defaultTheme.gridStyles.stroke );
		expect( result.xAxisLineStyles.stroke ).toBe( defaultTheme.xAxisLineStyles.stroke );
		expect( result.xTickLineStyles.stroke ).toBe( defaultTheme.xTickLineStyles.stroke );
		expect( result.svgLabelSmall.fill ).toBe( defaultTheme.svgLabelSmall.fill );
		expect( result.labelBackgroundColor ).toBe( defaultTheme.labelBackgroundColor );
		expect( result.labelTextColor ).toBe( defaultTheme.labelTextColor );

		expect( merged.backgroundColor ).toBe( '#111' );
		expect( merged.gridStyles.stroke ).toBe( '#222' );
	} );

	it( 'leaves fields alone when no role was overridden', () => {
		const merged = mergeThemes( defaultTheme, {
			tickLength: 8,
			leaderboardChart: { deltaColors: [ 'red', 'grey', 'green' ] },
		} as Partial< ChartTheme > );

		const result = withCatalogPointers( merged, [] );

		expect( result.tickLength ).toBe( 8 );
		expect( result.gridStyles.stroke ).toBe( defaultTheme.gridStyles.stroke );
		// Not a mapped role, so its literal survives even when other roles are being restored.
		expect( result.leaderboardChart.deltaColors ).toEqual( [ 'red', 'grey', 'green' ] );
	} );

	// The palette is restored as a whole, so a consumer's short array cannot shorten it. `mergeThemes` replaces arrays outright, and a two-entry palette would leave slots 3 to 5 unreadable — a CSS declaration of one of them would have no entry to resolve through.
	it( 'restores the full five-slot palette from a shorter consumer array', () => {
		const merged = mergeThemes( defaultTheme, {
			colors: [ '#111', '#222' ],
		} as Partial< ChartTheme > );

		const result = withCatalogPointers( merged, [
			'--a8c-charts-color-series-1',
			'--a8c-charts-color-series-2',
		] );

		expect( result.colors ).toEqual( [
			'var(--a8c-charts-color-series-1, #111)',
			'var(--a8c-charts-color-series-2, #222)',
			'var(--a8c-charts-color-series-3)',
			'var(--a8c-charts-color-series-4)',
			'var(--a8c-charts-color-series-5)',
		] );
	} );

	// Each slot's restore rewrites the whole array, so restoring five of them must not wrap the pointers five times over.
	it( 'restores the palette idempotently across every overridden slot', () => {
		const merged = mergeThemes( defaultTheme, {
			colors: [ '#111', '#222', '#333', '#444', '#555' ],
		} as Partial< ChartTheme > );

		const result = withCatalogPointers( merged, [
			'--a8c-charts-color-series-1',
			'--a8c-charts-color-series-2',
			'--a8c-charts-color-series-3',
			'--a8c-charts-color-series-4',
			'--a8c-charts-color-series-5',
		] );

		expect( result.colors ).toEqual( [
			'var(--a8c-charts-color-series-1, #111)',
			'var(--a8c-charts-color-series-2, #222)',
			'var(--a8c-charts-color-series-3, #333)',
			'var(--a8c-charts-color-series-4, #444)',
			'var(--a8c-charts-color-series-5, #555)',
		] );
	} );

	// The literal is only reached where getComputedStyle resolves nothing, and the palette is the one field where falling back to the catalog default would be visible: every series would paint the same seeded blue.
	it( 'keeps the consumer color as each pointer’s terminal literal, for SSR and jsdom', () => {
		const merged = mergeThemes( defaultTheme, { colors: [ 'red' ] } as Partial< ChartTheme > );
		const result = withCatalogPointers( merged, [ '--a8c-charts-color-series-1' ] );

		expect( result.colors[ 0 ] ).toBe( 'var(--a8c-charts-color-series-1, red)' );
	} );
} );
