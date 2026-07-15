/**
 * External dependencies
 */
import { useReportCoupons } from '@jetpack-premium-analytics/data';
import { coupon } from '@jetpack-premium-analytics/icons';
import { __ } from '@wordpress/i18n';
import { useMemo } from 'react';
import { BarChart, WidgetState } from '../../components';
/**
 * Internal dependencies
 */
import { useWidgetRootContext } from '../../components/widget-root';
import { buildSalesByCouponData, isEmptyChartData } from '../../helpers';
import { useBarStyles } from '../common';

/**
 * Sales by Coupon Widget Component
 *
 * Displays a bar chart showing coupon discount distribution.
 * Shows top 3 coupons plus "Other" segment.
 * Displays data for all product types.
 *
 * Must be used within a WidgetRoot which provides reportParams via context.
 *
 * @example
 * ```tsx
 * <WidgetRoot attributes={ attributes }>
 *     <SalesByCouponWidget />
 * </WidgetRoot>
 * ```
 */
export function SalesByCouponWidget() {
	const { reportParams } = useWidgetRootContext();

	const { primary, comparison, isLoading, isFetching, hasData, isError, refetch } =
		useReportCoupons( reportParams );

	const { chartData } = useMemo(
		() => buildSalesByCouponData( primary.data, comparison.data, reportParams, 3 ),
		[ primary.data, comparison.data, reportParams ]
	);

	const barStyles = useBarStyles( chartData );

	return (
		<WidgetState
			isLoading={ isLoading && ! hasData }
			isFetching={ isFetching }
			// The report queries keep the previous period's data as placeholders
			// across range changes, so only surface the error when there is
			// nothing to show.
			isError={ isError && ! hasData }
			isEmpty={ isEmptyChartData( chartData ) }
			error={ {
				description: __(
					"We couldn't load coupon sales data. Please try again in a moment.",
					'jetpack-premium-analytics'
				),
				actions: [ { label: __( 'Retry', 'jetpack-premium-analytics' ), onClick: refetch } ],
			} }
			empty={ {
				icon: coupon,
				description: __( 'No coupon sales in this period.', 'jetpack-premium-analytics' ),
			} }
		>
			<BarChart
				chartData={ chartData }
				styles={ barStyles }
				dataFormat={ {
					type: 'currency',
					options: { useMultipliers: true, decimals: 0 },
				} }
			/>
		</WidgetState>
	);
}
