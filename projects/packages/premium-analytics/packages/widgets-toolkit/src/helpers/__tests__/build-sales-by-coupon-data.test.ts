/**
 * Mock formatters to avoid pulling in heavy transitive deps.
 */
jest.mock( '@jetpack-premium-analytics/formatters', () => ( {
	formatDateRange: () => 'Jan 1 – 31, 2024',
} ) );
/**
 * Internal dependencies
 */
import { buildSalesByCouponData } from '../build-sales-by-coupon-data';

const defaultReportParams = {
	from: '2024-01-01',
	to: '2024-01-31',
	compare_from: '2023-12-01',
	compare_to: '2023-12-31',
	interval: 'day' as const,
};

function makeCouponsData(
	items: Array< {
		coupon_code: string;
		total_sales: number;
		discount_amount: number;
	} >,
	summary: Record< string, unknown > = {}
) {
	return {
		data: items.map( item => ( {
			...item,
			coupon_id: 1,
			orders_count: 1,
		} ) ),
		summary: {
			total_sales: 0,
			total_discount_amount: 0,
			total_orders: 0,
			...summary,
		},
	};
}

describe( 'buildSalesByCouponData', () => {
	it( 'returns empty chartData when coupons is undefined', () => {
		const result = buildSalesByCouponData( undefined, undefined, defaultReportParams );

		expect( result.chartData ).toEqual( [] );
	} );

	it( 'returns empty chartData when coupons has no summary', () => {
		const result = buildSalesByCouponData(
			{ data: [], summary: undefined } as any,
			undefined,
			defaultReportParams
		);

		expect( result.chartData ).toEqual( [] );
	} );

	it( 'builds current period data from top coupons', () => {
		const coupons = makeCouponsData(
			[
				{
					coupon_code: 'SAVE10',
					total_sales: 100,
					discount_amount: 10,
				},
				{
					coupon_code: 'SAVE20',
					total_sales: 200,
					discount_amount: 20,
				},
			],
			{ total_sales: 300 }
		);

		const result = buildSalesByCouponData( coupons as any, undefined, defaultReportParams );

		expect( result.chartData ).toHaveLength( 1 );
		expect( result.chartData[ 0 ].data ).toEqual( [
			{ label: 'SAVE10', value: 100 },
			{ label: 'SAVE20', value: 200 },
		] );
	} );

	it( 'aggregates remaining coupons into "Other" segment', () => {
		const coupons = makeCouponsData(
			[
				{ coupon_code: 'A', total_sales: 100, discount_amount: 5 },
				{ coupon_code: 'B', total_sales: 200, discount_amount: 10 },
				{ coupon_code: 'C', total_sales: 300, discount_amount: 15 },
				{ coupon_code: 'D', total_sales: 50, discount_amount: 2 },
				{ coupon_code: 'E', total_sales: 75, discount_amount: 3 },
			],
			{ total_sales: 725 }
		);

		const result = buildSalesByCouponData( coupons as any, undefined, defaultReportParams, 3 );

		const currentPeriod = result.chartData[ 0 ].data;
		expect( currentPeriod ).toHaveLength( 4 ); // 3 top + Other
		expect( currentPeriod[ 3 ] ).toEqual( {
			label: 'Other',
			value: 125, // 50 + 75
		} );
	} );

	it( 'includes comparison period data when provided', () => {
		const coupons = makeCouponsData(
			[
				{
					coupon_code: 'SAVE10',
					total_sales: 100,
					discount_amount: 10,
				},
			],
			{ total_sales: 100 }
		);

		const comparisonCoupons = makeCouponsData(
			[ { coupon_code: 'SAVE10', total_sales: 80, discount_amount: 8 } ],
			{ total_sales: 80 }
		);

		const result = buildSalesByCouponData(
			coupons as any,
			comparisonCoupons as any,
			defaultReportParams
		);

		expect( result.chartData ).toHaveLength( 2 );
		expect( result.chartData[ 1 ].data[ 0 ] ).toEqual( {
			label: 'SAVE10',
			value: 80,
		} );
	} );

	it( 'uses total_sales not discount_amount for values', () => {
		const coupons = makeCouponsData(
			[ { coupon_code: 'BIG', total_sales: 500, discount_amount: 50 } ],
			{ total_sales: 500 }
		);

		const result = buildSalesByCouponData( coupons as any, undefined, defaultReportParams );

		expect( result.chartData[ 0 ].data[ 0 ].value ).toBe( 500 );
	} );

	it( 'respects custom totalSegments parameter', () => {
		const coupons = makeCouponsData(
			[
				{ coupon_code: 'A', total_sales: 100, discount_amount: 5 },
				{ coupon_code: 'B', total_sales: 200, discount_amount: 10 },
				{ coupon_code: 'C', total_sales: 300, discount_amount: 15 },
			],
			{ total_sales: 600 }
		);

		const result = buildSalesByCouponData( coupons as any, undefined, defaultReportParams, 2 );

		const currentPeriod = result.chartData[ 0 ].data;
		expect( currentPeriod ).toHaveLength( 3 ); // 2 top + Other
		expect( currentPeriod[ 2 ] ).toEqual( {
			label: 'Other',
			value: 300,
		} );
	} );

	it( 'returns 0 for missing comparison coupon codes', () => {
		const coupons = makeCouponsData(
			[ { coupon_code: 'NEW', total_sales: 100, discount_amount: 10 } ],
			{ total_sales: 100 }
		);

		const comparisonCoupons = makeCouponsData(
			[ { coupon_code: 'OLD', total_sales: 50, discount_amount: 5 } ],
			{ total_sales: 50 }
		);

		const result = buildSalesByCouponData(
			coupons as any,
			comparisonCoupons as any,
			defaultReportParams
		);

		// "NEW" didn't exist in comparison period
		expect( result.chartData[ 1 ].data[ 0 ].value ).toBe( 0 );
	} );
} );
