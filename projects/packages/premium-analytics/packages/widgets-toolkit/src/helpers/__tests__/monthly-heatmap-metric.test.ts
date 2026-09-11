/**
 * Internal dependencies
 */
import { monthlyHeatmapLabels, resolveMonthlyHeatmapMetric } from '../monthly-heatmap-metric';

describe( 'resolveMonthlyHeatmapMetric', () => {
	it( 'reads anything but average as the total', () => {
		expect( resolveMonthlyHeatmapMetric( 'average' ) ).toBe( 'average' );
		expect( resolveMonthlyHeatmapMetric( 'total' ) ).toBe( 'total' );
		expect( resolveMonthlyHeatmapMetric( undefined ) ).toBe( 'total' );
		expect( resolveMonthlyHeatmapMetric( 'median' ) ).toBe( 'total' );
	} );
} );

describe( 'monthlyHeatmapLabels', () => {
	it( 'names views under the total and views per day under the average', () => {
		const total = monthlyHeatmapLabels( 'total' );
		const average = monthlyHeatmapLabels( 'average' );

		expect( total.formatValue( 2 ) ).toBe( '2 views' );
		expect( total.lessLabel ).toBe( 'Fewer views' );
		expect( total.moreLabel ).toBe( 'More views' );
		expect( average.formatValue( 2 ) ).toBe( '2 views per day' );
		expect( average.lessLabel ).toBe( 'Fewer views per day' );
		expect( average.moreLabel ).toBe( 'More views per day' );
		expect( average.emptyLabel ).toBe( total.emptyLabel );
	} );
} );
