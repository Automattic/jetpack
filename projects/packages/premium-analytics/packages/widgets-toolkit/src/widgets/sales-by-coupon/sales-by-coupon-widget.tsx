/**
 * External dependencies
 */
import { useMemo } from 'react';
import { WidgetLoadingOverlay } from '@automattic/dashboard';
import { useReportCoupons } from '@next-woo-analytics/data';
import { coupon } from '@next-woo-analytics/icons';

/**
 * Internal dependencies
 */
import { useWidgetRootContext } from '../../components/widget-root';
import { BarChart } from '../../components';
import { buildSalesByCouponData } from '../../helpers';
import { useWidgetError } from '../../hooks';
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

	const {
		primary,
		comparison,
		isLoading,
		isFetching,
		hasData,
		isError,
		error,
		refetch,
	} = useReportCoupons( reportParams );

	const isInitialLoading = isLoading && ! hasData;
	const isRefetching = isFetching && hasData;

	const { chartData } = useMemo(
		() =>
			buildSalesByCouponData(
				primary.data,
				comparison.data,
				reportParams,
				3
			),
		[ primary.data, comparison.data, reportParams ]
	);

	const barStyles = useBarStyles( chartData );

	const hasError = useWidgetError( isError, error, refetch );
	if ( hasError ) {
		return null;
	}

	if ( isInitialLoading ) {
		return <WidgetLoadingOverlay />;
	}

	return (
		<>
			<BarChart
				chartData={ chartData }
				styles={ barStyles }
				dataFormat={ {
					type: 'currency',
					options: { useMultipliers: true, decimals: 0 },
				} }
				emptyStateIcon={ coupon }
			/>
			{ isRefetching && <WidgetLoadingOverlay /> }
		</>
	);
}
