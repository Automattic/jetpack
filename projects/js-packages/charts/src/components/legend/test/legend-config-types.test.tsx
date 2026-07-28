import type {
	ChartLegendConfig,
	SeriesChartLegendConfig,
	DataPointPercentage,
} from '../../../types';

// Type-level tests. The assertions that matter are the `@ts-expect-error` directives, which the
// package typecheck enforces — an unused directive is itself a compile error, so these fail loudly
// if `collapseGroups` ever leaks onto the base config that point-based charts use.
describe( 'collapseGroups legend config', () => {
	test( 'is available on the series legend config', () => {
		const seriesLegend: SeriesChartLegendConfig = { collapseGroups: true };

		expect( seriesLegend.collapseGroups ).toBe( true );
	} );

	test( 'is not part of the base config point charts use', () => {
		const pieLegend: ChartLegendConfig< DataPointPercentage[] > = {
			// @ts-expect-error collapseGroups is only on SeriesChartLegendConfig — pie segments carry
			// `group` purely to coordinate colours with other charts, not to collapse legend rows.
			collapseGroups: true,
		};

		expect( pieLegend ).toBeDefined();
	} );

	test( 'leaves other legend options available on the base config', () => {
		const pieLegend: ChartLegendConfig< DataPointPercentage[] > = { interactive: true };

		expect( pieLegend.interactive ).toBe( true );
	} );
} );
