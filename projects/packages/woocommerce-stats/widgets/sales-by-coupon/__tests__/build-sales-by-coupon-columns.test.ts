/**
 * Internal dependencies
 */
import { buildSalesByCouponColumns } from '../build-sales-by-coupon-columns';

const row = ( coupon_code: string, total_sales: number ) => ( { coupon_code, total_sales } );

describe( 'buildSalesByCouponColumns', () => {
	it( 'tops the ranking and sums the rest into Other over the same coupons in both periods', () => {
		const columns = buildSalesByCouponColumns(
			[ row( 'A', 300 ), row( 'B', 200 ), row( 'C', 100 ), row( 'D', 50 ), row( 'E', 75 ) ],
			[ row( 'A', 250 ), row( 'D', 40 ), row( 'E', 10 ), row( 'X', 999 ) ],
			3
		);

		expect( columns ).toEqual( [
			{ label: 'A', value: 300, previousValue: 250 },
			{ label: 'B', value: 200, previousValue: 0 },
			{ label: 'C', value: 100, previousValue: 0 },
			{ label: 'Other', value: 125, previousValue: 50 },
		] );
	} );

	it( 'carries no comparison figures while the comparison period is off', () => {
		expect( buildSalesByCouponColumns( [ row( 'A', 300 ) ], undefined, 3 ) ).toEqual( [
			{ label: 'A', value: 300, previousValue: undefined },
		] );
	} );
} );
