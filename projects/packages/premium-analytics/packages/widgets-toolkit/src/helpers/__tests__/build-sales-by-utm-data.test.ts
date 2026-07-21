/**
 * Internal dependencies
 */
import { buildSalesByUtmData } from '../build-sales-by-utm-data';
import type { ReportDataMap } from '@jetpack-premium-analytics/data';

const buildOrderAttribution = (
	data: Array< {
		item: string;
		current: number;
		previous?: number;
	} >
) =>
	( {
		data: data.map( ( { item, current, previous } ) => ( {
			item,
			current_period: { value: current },
			...( previous !== undefined ? { previous_period: { value: previous } } : {} ),
		} ) ),
	} ) as ReportDataMap[ 'order-attribution' ];

describe( 'buildSalesByUtmData', () => {
	it( 'keeps a real delta for sources present in both periods', () => {
		const [ row ] = buildSalesByUtmData(
			buildOrderAttribution( [ { item: 'newsletter', current: 150, previous: 100 } ] )
		);

		expect( row.previousValue ).toBe( 100 );
		expect( row.delta ).toBe( 50 );
	} );

	it( 'leaves comparison fields undefined for a source absent from the comparison period', () => {
		const [ row ] = buildSalesByUtmData(
			buildOrderAttribution( [ { item: 'newsletter', current: 500 } ] )
		);

		// No previous_period at all is an unknown previous value, not a real 0,
		// so the chart shows the missing-data placeholder rather than implying
		// the source earned nothing last period.
		expect( row.previousValue ).toBeUndefined();
		expect( row.previousShare ).toBeUndefined();
		expect( row.delta ).toBeUndefined();
	} );

	it( 'reports an unavailable delta for a real previous value of zero', () => {
		const [ row ] = buildSalesByUtmData(
			buildOrderAttribution( [ { item: 'newsletter', current: 500, previous: 0 } ] )
		);

		expect( row.previousValue ).toBe( 0 );
		expect( row.previousShare ).toBe( 0 );
		expect( row.delta ).toBeUndefined();
	} );

	it( 'keeps a genuine zero change when both periods are zero', () => {
		const [ row ] = buildSalesByUtmData(
			buildOrderAttribution( [ { item: 'newsletter', current: 0, previous: 0 } ] )
		);

		expect( row.delta ).toBe( 0 );
	} );
} );
