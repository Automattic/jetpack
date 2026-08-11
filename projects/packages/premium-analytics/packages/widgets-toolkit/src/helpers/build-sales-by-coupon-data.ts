/**
 * External dependencies
 */
import { __ } from '@wordpress/i18n';
import { formatLegendLabels } from './format-legend-labels';
import type { ReportDataMap, ReportParams } from '@jetpack-premium-analytics/data';
import type { SeriesData } from '@jetpack-premium-analytics/externals';

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

	const topCoupons = items.slice( 0, totalSegments );

	const comparisonMap = new Map< string, number >();
	if ( comparisonCoupons ) {
		comparisonCoupons.data.forEach( item => {
			comparisonMap.set( item.coupon_code, item.total_sales );
		} );
	}

	const currentPeriodData = topCoupons.map( item => ( {
		label: item.coupon_code,
		value: item.total_sales,
	} ) );

	if ( items.length > totalSegments ) {
		const otherSales = items
			.slice( totalSegments )
			.reduce( ( sum, item ) => sum + item.total_sales, 0 );

		currentPeriodData.push( {
			label: __( 'Other', 'jetpack-premium-analytics-pkg' ),
			value: otherSales,
		} );
	}

	const chartData: SeriesData[] = [
		{
			label: primaryLabel,
			data: currentPeriodData,
		},
	];

	if ( comparisonCoupons?.summary ) {
		const comparisonPeriodData = topCoupons.map( item => ( {
			label: item.coupon_code,
			value: comparisonMap.get( item.coupon_code ) || 0,
		} ) );

		if ( items.length > totalSegments ) {
			const otherComparison = comparisonCoupons.data
				.slice( totalSegments )
				.reduce( ( sum, item ) => sum + item.total_sales, 0 );

			comparisonPeriodData.push( {
				label: __( 'Other', 'jetpack-premium-analytics-pkg' ),
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
