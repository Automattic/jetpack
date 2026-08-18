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
		} as Partial< ChartTheme > );

		const result = withCatalogPointers( merged, [
			'--a8c-charts-color-background',
			'--a8c-charts-color-grid',
			'--a8c-charts-color-axis',
			'--a8c-charts-color-tick',
			'--a8c-charts-color-label-axis',
		] );

		expect( result.backgroundColor ).toBe( defaultTheme.backgroundColor );
		expect( result.gridStyles.stroke ).toBe( defaultTheme.gridStyles.stroke );
		expect( result.xAxisLineStyles.stroke ).toBe( defaultTheme.xAxisLineStyles.stroke );
		expect( result.xTickLineStyles.stroke ).toBe( defaultTheme.xTickLineStyles.stroke );
		expect( result.svgLabelSmall.fill ).toBe( defaultTheme.svgLabelSmall.fill );

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
} );
