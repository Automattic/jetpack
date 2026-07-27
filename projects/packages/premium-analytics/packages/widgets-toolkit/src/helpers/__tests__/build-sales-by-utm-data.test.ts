/**
 * Internal dependencies
 */
import { buildSalesByUtmData } from '../build-sales-by-utm-data';
import type { ReportDataMap } from '@jetpack-premium-analytics/data';

// The sanitized attribution summary always carries a previous_period, so the
// fixture requires one: a source with no sales in the comparison period
// arrives as a real 0, never as a missing field.
const buildOrderAttribution = (
	data: Array< {
		item: string;
		current: number;
		previous: number;
	} >
) =>
	( {
		data: data.map( ( { item, current, previous } ) => ( {
			item,
			current_period: { value: current },
			previous_period: { value: previous },
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

	it( 'reports an unavailable delta for a previous value of zero', () => {
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
