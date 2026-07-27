import type { ChartLegendConfig, DataPointPercentage, SeriesData } from '../../../types';

// Type-level tests. The assertions that matter are the `@ts-expect-error` directives, which the
// package typecheck enforces — an unused directive is itself a compile error, so these fail loudly
// if `collapseGroups` ever leaks onto a chart that cannot honour it.
describe( 'ChartLegendConfig collapseGroups', () => {
	test( 'is available on charts that render series', () => {
		const seriesLegend: ChartLegendConfig< SeriesData[] > = { collapseGroups: true };

		expect( seriesLegend.collapseGroups ).toBe( true );
	} );

	test( 'is rejected on point-based charts such as pie', () => {
		const pieLegend: ChartLegendConfig< DataPointPercentage[] > = {
			// @ts-expect-error collapseGroups only applies to charts that render SeriesData — pie
			// segments carry `group` purely to coordinate colours with other charts.
			collapseGroups: true,
		};

		expect( pieLegend ).toBeDefined();
	} );

	test( 'leaves other legend options available everywhere', () => {
		const pieLegend: ChartLegendConfig< DataPointPercentage[] > = { interactive: true };

		expect( pieLegend.interactive ).toBe( true );
	} );
} );
