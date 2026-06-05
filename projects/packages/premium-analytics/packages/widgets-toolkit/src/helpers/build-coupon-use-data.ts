/**
 * External dependencies
 */
import { formatMetricValue } from '@jetpack-premium-analytics/formatters';
import { __ } from '@wordpress/i18n';
/**
 * Internal dependencies
 */
import type { LegendItem } from '../components';
import type { DonutChartData } from '../components/chart-donut/donut-chart';
import type { ReportDataMap } from '@jetpack-premium-analytics/data';

export interface CouponUseData {
	chartData: DonutChartData;
	total: number;
	comparisonTotal: number;
	legendData: LegendItem[];
}

/**
 * Builds chart and legend data for the Coupon Use widget.
 *
 * Uses pre-computed sales_with_coupon / sales_without_coupon from the
 * coupons/by-date endpoint so the donut chart shows the correct breakdown
 * of sales with vs without coupons across all orders.
 *
 * @param coupons           - Primary period coupon-by-date data
 * @param comparisonCoupons - Comparison period coupon-by-date data
 * @param hasComparison     - Whether comparison period should be included
 */
export function buildCouponUseData(
	coupons: ReportDataMap[ 'couponsByDate' ] | null | undefined,
	comparisonCoupons: ReportDataMap[ 'couponsByDate' ] | null | undefined,
	hasComparison = true
): CouponUseData {
	if ( ! coupons?.summary ) {
		return {
			chartData: [],
			total: 0,
			comparisonTotal: 0,
			legendData: [],
		};
	}

	const salesWithCoupon = coupons.summary.sales_with_coupon;
	const salesWithoutCoupon = coupons.summary.sales_without_coupon;
	const totalSales = coupons.summary.total_sales;

	// Pick comparison totals
	const comparisonTotalSales = comparisonCoupons?.summary.total_sales || 0;
	const comparisonSalesWithCoupon = comparisonCoupons?.summary.sales_with_coupon || 0;
	const comparisonSalesWithoutCoupon = comparisonCoupons?.summary.sales_without_coupon || 0;

	// If there are no sales, return empty state
	if ( totalSales === 0 ) {
		return {
			chartData: [],
			total: 0,
			comparisonTotal: comparisonTotalSales,
			legendData: [],
		};
	}

	// Build chart data showing sales breakdown
	const chartData: DonutChartData = [
		{
			label: __( 'With coupons', 'jetpack-premium-analytics' ),
			value: salesWithCoupon,
			valueDisplay: formatMetricValue( salesWithCoupon, 'currency', {
				useMultipliers: true,
				decimals: 0,
			} ),
		},
		{
			label: __( 'No coupons', 'jetpack-premium-analytics' ),
			value: salesWithoutCoupon,
			valueDisplay: formatMetricValue( salesWithoutCoupon, 'currency', {
				useMultipliers: true,
				decimals: 0,
			} ),
		},
	];

	// Build legend data
	const legendData: LegendItem[] = [
		{
			label: __( 'With coupons', 'jetpack-premium-analytics' ),
			value: salesWithCoupon,
			displayValue: formatMetricValue( salesWithCoupon, 'currency', {
				useMultipliers: true,
				decimals: 0,
			} ),
			comparison: hasComparison ? comparisonSalesWithCoupon : undefined,
		},
		{
			label: __( 'No coupons', 'jetpack-premium-analytics' ),
			value: salesWithoutCoupon,
			displayValue: formatMetricValue( salesWithoutCoupon, 'currency', {
				useMultipliers: true,
				decimals: 0,
			} ),
			comparison: hasComparison ? comparisonSalesWithoutCoupon : undefined,
		},
	];

	return {
		chartData,
		total: totalSales,
		comparisonTotal: comparisonTotalSales,
		legendData,
	};
}
