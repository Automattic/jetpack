/**
 * Internal dependencies
 */
import { normalizeOrderAttributionByProductResponse } from '../order-attribution/normalize-order-attribution-by-product-response';

const report = ( rows: Array< [ string, string ] > ) => ( {
	view: 'device' as const,
	order_by: 'net_sales',
	data: rows.map( ( [ item, value ] ) => ( {
		item,
		value,
		intervals: [ { time_interval: 'd', date_start: 's', date_end: 'e', net_sales: value } ],
	} ) ),
} );

const previousValues = ( previous?: ReturnType< typeof report > ) =>
	normalizeOrderAttributionByProductResponse(
		report( [
			[ 'Desktop', '500' ],
			[ 'Tablet', '120' ],
		] ),
		previous
	).data.map( row => [
		row.item,
		row.previous_period.value,
		row.previous_period.intervals.length,
	] );

describe( 'normalizeOrderAttributionByProductResponse', () => {
	it( 'leaves an item the comparison lacks without a previous value', () => {
		expect( previousValues( report( [ [ 'Desktop', '400' ] ] ) ) ).toEqual( [
			[ 'Desktop', '400', 1 ],
			[ 'Tablet', null, 0 ],
		] );
	} );

	it( 'reads the current period as the previous one without a comparison', () => {
		expect( previousValues() ).toEqual( [
			[ 'Desktop', '500', 1 ],
			[ 'Tablet', '120', 1 ],
		] );
	} );
} );
