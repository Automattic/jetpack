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
	const FULL_LIST = report( [
		[ 'Desktop', '400' ],
		[ 'Mobile', '300' ],
		[ 'Watch', '200' ],
		[ 'Console', '100' ],
		[ 'TV', '50' ],
	] );

	it.each( [
		[
			'a full list, which may have cut it',
			FULL_LIST,
			[ 'Desktop', '400', 1 ],
			[ 'Tablet', null, 0 ],
		],
		[
			'a shorter list, so it had no sales',
			report( [ [ 'Desktop', '400' ] ] ),
			[ 'Desktop', '400', 1 ],
			[ 'Tablet', '0', 1 ],
		],
		[ 'no items at all', report( [] ), [ 'Desktop', '0', 1 ], [ 'Tablet', '0', 1 ] ],
	] )( 'reads an item missing from %s', ( _, previous, desktop, tablet ) => {
		expect( previousValues( previous ).slice( 0, 2 ) ).toEqual( [ desktop, tablet ] );
	} );

	it( 'reads the current period as the previous one without a comparison', () => {
		expect( previousValues() ).toEqual( [
			[ 'Desktop', '500', 1 ],
			[ 'Tablet', '120', 1 ],
		] );
	} );
} );
