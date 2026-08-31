/**
 * Mock formatMetricValue to avoid pulling in heavy transitive deps.
 */
jest.mock( '@jetpack-premium-analytics/formatters', () => ( {
	formatMetricValue: ( value: number ) => `$${ value }`,
} ) );
/**
 * Internal dependencies
 */
import { buildCouponUseData } from '../build-coupon-use-data';

type CouponsByDateSummary = {
	total_orders: number;
	orders_with_coupon: number;
	orders_without_coupon: number;
	total_sales: number;
	sales_with_coupon: number;
	sales_without_coupon: number;
	total_discount_amount: number;
	net_sales_after_discount: number;
	coupon_usage_percentage: number;
};

function makeCouponsByDateData( summary: Partial< CouponsByDateSummary > ) {
	return {
		data: [],
		summary: {
			date_start: '2024-01-01',
			date_end: '2024-01-31',
			total_orders: 0,
			orders_with_coupon: 0,
			orders_without_coupon: 0,
			total_sales: 0,
			sales_with_coupon: 0,
			sales_without_coupon: 0,
			total_discount_amount: 0,
			net_sales_after_discount: 0,
			coupon_usage_percentage: 0,
			...summary,
		},
	};
}

describe( 'buildCouponUseData', () => {
	it( 'returns empty state when coupons is undefined', () => {
		const result = buildCouponUseData( undefined, undefined );

		expect( result ).toEqual( {
			chartData: [],
			total: 0,
			comparisonTotal: 0,
			legendData: [],
		} );
	} );

	it( 'returns empty state when coupons is null', () => {
		const result = buildCouponUseData( null, null );

		expect( result ).toEqual( {
			chartData: [],
			total: 0,
			comparisonTotal: 0,
			legendData: [],
		} );
	} );

	it( 'returns empty state when total sales is zero', () => {
		const coupons = makeCouponsByDateData( {
			total_sales: 0,
			sales_with_coupon: 0,
			sales_without_coupon: 0,
		} );

		const result = buildCouponUseData( coupons, undefined );

		expect( result.chartData ).toEqual( [] );
		expect( result.total ).toBe( 0 );
		expect( result.legendData ).toEqual( [] );
	} );

	it( 'builds donut data from sales with and without coupons', () => {
		const coupons = makeCouponsByDateData( {
			total_sales: 300,
			sales_with_coupon: 200,
			sales_without_coupon: 100,
		} );

		const result = buildCouponUseData( coupons, undefined );

		expect( result.chartData ).toHaveLength( 2 );
		expect( result.chartData[ 0 ].value ).toBe( 200 );
		expect( result.chartData[ 0 ].label ).toBe( 'With coupons' );
		expect( result.chartData[ 1 ].value ).toBe( 100 );
		expect( result.chartData[ 1 ].label ).toBe( 'No coupons' );
		expect( result.total ).toBe( 300 );
	} );

	it( 'includes comparison values in legend when hasComparison is true', () => {
		const coupons = makeCouponsByDateData( {
			total_sales: 300,
			sales_with_coupon: 200,
			sales_without_coupon: 100,
		} );

		const comparison = makeCouponsByDateData( {
			total_sales: 250,
			sales_with_coupon: 150,
			sales_without_coupon: 100,
		} );

		const result = buildCouponUseData( coupons, comparison, true );

		expect( result.comparisonTotal ).toBe( 250 );
		expect( result.legendData[ 0 ].comparison ).toBe( 150 );
		expect( result.legendData[ 1 ].comparison ).toBe( 100 );
	} );

	it( 'excludes comparison values from legend when hasComparison is false', () => {
		const coupons = makeCouponsByDateData( {
			total_sales: 300,
			sales_with_coupon: 200,
			sales_without_coupon: 100,
		} );

		const comparison = makeCouponsByDateData( {
			total_sales: 250,
			sales_with_coupon: 150,
			sales_without_coupon: 100,
		} );

		const result = buildCouponUseData( coupons, comparison, false );

		expect( result.legendData[ 0 ].comparison ).toBeUndefined();
		expect( result.legendData[ 1 ].comparison ).toBeUndefined();
	} );

	it( 'handles case where all sales use coupons', () => {
		const coupons = makeCouponsByDateData( {
			total_sales: 500,
			sales_with_coupon: 500,
			sales_without_coupon: 0,
		} );

		const result = buildCouponUseData( coupons, undefined );

		expect( result.chartData[ 0 ].value ).toBe( 500 );
		expect( result.chartData[ 1 ].value ).toBe( 0 );
		expect( result.total ).toBe( 500 );
	} );

	it( 'defaults comparison totals to 0 when comparison data is missing', () => {
		const coupons = makeCouponsByDateData( {
			total_sales: 300,
			sales_with_coupon: 200,
			sales_without_coupon: 100,
		} );

		const result = buildCouponUseData( coupons, undefined, true );

		expect( result.comparisonTotal ).toBe( 0 );
		expect( result.legendData[ 0 ].comparison ).toBe( 0 );
		expect( result.legendData[ 1 ].comparison ).toBe( 0 );
	} );
} );
