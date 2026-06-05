/**
 * External dependencies
 */
import { __ } from '@wordpress/i18n';
import { formatLegendLabels } from './format-legend-labels';
import type { SeriesData } from '@automattic/charts';
import type { ReportDataMap, ReportParams } from '@jetpack-premium-analytics/data';

/**
 * Internal dependencies
 */

export interface SalesByCouponData {
	chartData: SeriesData[];
}

/**
 * Builds bar chart data for the Sales by Coupon widget.
 *
 * Shows revenue distribution by coupon with top coupons plus "Other" segment.
 *
 * @param coupons           - Primary period coupon data
 * @param comparisonCoupons - Comparison period coupon data
 * @param reportParams      - Report parameters for generating date range labels
 * @param totalSegments     - Number of top coupons to show (rest goes to "Other")
 */
export function buildSalesByCouponData(
	coupons: ReportDataMap[ 'coupons' ] | undefined,
	comparisonCoupons: ReportDataMap[ 'coupons' ] | undefined,
	reportParams: ReportParams,
	totalSegments = 3
): SalesByCouponData {
	if ( ! coupons?.summary ) {
		return {
			chartData: [],
		};
	}

	const { primary: primaryLabel, comparison: comparisonLabel } = formatLegendLabels( reportParams );

	const { data: items } = coupons;

	// Process coupons and limit to totalSegments
	const topCoupons = items.slice( 0, totalSegments );

	// Create a map of comparison data by coupon code
	const comparisonMap = new Map< string, number >();
	if ( comparisonCoupons ) {
		comparisonCoupons.data.forEach( item => {
			comparisonMap.set( item.coupon_code, item.total_sales );
		} );
	}

	// Build current period data points
	const currentPeriodData = topCoupons.map( item => ( {
		label: item.coupon_code,
		value: item.total_sales,
	} ) );

	// Add "Other" segment if there are more coupons than shown
	if ( items.length > totalSegments ) {
		const otherSales = items
			.slice( totalSegments )
			.reduce( ( sum, item ) => sum + item.total_sales, 0 );

		currentPeriodData.push( {
			label: __( 'Other', 'jetpack-premium-analytics' ),
			value: otherSales,
		} );
	}

	// Build bar chart data - current period
	const chartData: SeriesData[] = [
		{
			label: primaryLabel,
			data: currentPeriodData,
		},
	];

	// Add comparison period if available
	if ( comparisonCoupons?.summary ) {
		const comparisonPeriodData = topCoupons.map( item => ( {
			label: item.coupon_code,
			value: comparisonMap.get( item.coupon_code ) || 0,
		} ) );

		// Add "Other" segment for comparison
		if ( items.length > totalSegments ) {
			const otherComparison = comparisonCoupons.data
				.slice( totalSegments )
				.reduce( ( sum, item ) => sum + item.total_sales, 0 );

			comparisonPeriodData.push( {
				label: __( 'Other', 'jetpack-premium-analytics' ),
				value: otherComparison,
			} );
		}

		chartData.push( {
			label: comparisonLabel,
			data: comparisonPeriodData,
		} );
	}

	return {
		chartData,
	};
}
