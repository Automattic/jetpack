import { mergeThemes } from '../../../utils';
import { withCatalogPointers } from '../private/with-catalog-pointers';
import { defaultTheme } from '../themes';
import type { ChartTheme } from '../../../types';

describe( 'withCatalogPointers', () => {
	it( 'restores an overridden role to its catalog pointer', () => {
		const merged = mergeThemes( defaultTheme, {
			gridStyles: { stroke: 'red' },
		} as Partial< ChartTheme > );

		const result = withCatalogPointers( merged, { '--a8c-charts-color-grid': 'red' } );

		expect( result.gridStyles.stroke ).toBe( defaultTheme.gridStyles.stroke );
		expect( result.gridStyles.stroke ).not.toBe( 'red' );
	} );

	it( 'leaves a role untouched when it was not overridden', () => {
		const merged = mergeThemes( defaultTheme, { tickLength: 8 } as Partial< ChartTheme > );

		const result = withCatalogPointers( merged, {} );

		expect( result.gridStyles.stroke ).toBe( defaultTheme.gridStyles.stroke );
		expect( result.tickLength ).toBe( 8 );
	} );

	it( 'leaves a non-mapped field carrying its literal override', () => {
		const merged = mergeThemes( defaultTheme, {
			leaderboardChart: { deltaColors: [ 'red', 'grey', 'green' ] },
		} as Partial< ChartTheme > );

		const result = withCatalogPointers( merged, {} );

		expect( result.leaderboardChart.deltaColors ).toEqual( [ 'red', 'grey', 'green' ] );
	} );

	it( 'restores every mapped role at once, without mutating the input theme', () => {
		const merged = mergeThemes( defaultTheme, {
			backgroundColor: '#111',
			gridStyles: { stroke: '#222' },
			xAxisLineStyles: { stroke: '#333' },
			xTickLineStyles: { stroke: '#444' },
			svgLabelSmall: { fill: '#555' },
		} as Partial< ChartTheme > );

		const result = withCatalogPointers( merged, {
			'--a8c-charts-color-background': '#111',
			'--a8c-charts-color-grid': '#222',
			'--a8c-charts-color-axis': '#333',
			'--a8c-charts-color-tick': '#444',
			'--a8c-charts-color-label-axis': '#555',
		} );

		expect( result.backgroundColor ).toBe( defaultTheme.backgroundColor );
		expect( result.gridStyles.stroke ).toBe( defaultTheme.gridStyles.stroke );
		expect( result.xAxisLineStyles.stroke ).toBe( defaultTheme.xAxisLineStyles.stroke );
		expect( result.xTickLineStyles.stroke ).toBe( defaultTheme.xTickLineStyles.stroke );
		expect( result.svgLabelSmall.fill ).toBe( defaultTheme.svgLabelSmall.fill );

		expect( merged.backgroundColor ).toBe( '#111' );
		expect( merged.gridStyles.stroke ).toBe( '#222' );
	} );
} );
