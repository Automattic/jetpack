/**
 * External dependencies
 */
import { __ } from '@wordpress/i18n';
import type { ColumnInput } from '@automattic/jetpack-premium-analytics-sdk';

type CouponRow = {
	coupon_code: string;
	total_sales: number;
};

const sum = ( figures: readonly number[] ) =>
	figures.reduce( ( total, figure ) => total + figure, 0 );

/**
 * The top coupons as columns, the rest summed into Other; the comparison figures follow the
 * same coupons, so Other compares like for like.
 *
 * @param {CouponRow[]|undefined} items           - The period's coupons, ranked.
 * @param {CouponRow[]|undefined} comparisonItems - The comparison period's coupons; undefined while the comparison is off.
 * @param {number}                top             - How many coupons get a column of their own.
 * @return {ColumnInput[]} The columns, or none without coupons.
 */
export function buildSalesByCouponColumns(
	items: readonly CouponRow[] | undefined,
	comparisonItems: readonly CouponRow[] | undefined,
	top: number
): ColumnInput[] {
	if ( ! items?.length ) {
		return [];
	}

	const previous = new Map(
		( comparisonItems ?? [] ).map( item => [ item.coupon_code, item.total_sales ] )
	);
	const previousOf = ( code: string ) =>
		comparisonItems ? ( previous.get( code ) ?? 0 ) : undefined;

	const columns: ColumnInput[] = items.slice( 0, top ).map( item => ( {
		label: item.coupon_code,
		value: item.total_sales,
		previousValue: previousOf( item.coupon_code ),
	} ) );

	const rest = items.slice( top );
	if ( rest.length ) {
		columns.push( {
			label: __( 'Other', 'jetpack-woocommerce-stats-pkg' ),
			value: sum( rest.map( item => item.total_sales ) ),
			previousValue: comparisonItems
				? sum( rest.map( item => previousOf( item.coupon_code ) ?? 0 ) )
				: undefined,
		} );
	}

	return columns;
}
