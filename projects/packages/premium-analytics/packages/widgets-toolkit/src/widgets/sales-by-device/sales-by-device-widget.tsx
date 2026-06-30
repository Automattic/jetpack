/**
 * External dependencies
 */
import { useReportOrderAttribution, type FilterCondition } from '@jetpack-premium-analytics/data';
import { device } from '@jetpack-premium-analytics/icons';
import { useMemo } from 'react';
import { BarChart } from '../../components';
import { WidgetLoadingOverlay } from '../../components/widget-loading-overlay';
/**
 * Internal dependencies
 */
import { useWidgetRootContext } from '../../components/widget-root';
import { buildSalesByDeviceData } from '../../helpers';
import { useWidgetError } from '../../hooks';
import { useBarStyles } from '../common';

type SalesByDeviceWidgetProps = {
	/**
	 * Optional product type filter to apply when fetching order attribution data.
	 *
	 * When provided, filters results to specific product types (e.g., bookings only).
	 * When omitted, shows data for all product types.
	 */
	filter?: FilterCondition;
};

/**
 * Sales by Device Widget Component
 *
 * Displays a bar chart showing sales breakdown by device type (Desktop, Mobile, Tablet).
 *
 * Features:
 * - Optional product type filtering (e.g., bookings only)
 * - Comparison support (current vs previous period)
 *
 * Must be used within a WidgetRoot which provides reportParams via context.
 *
 * @param props        - Component props
 * @param props.filter - Optional product type filter
 *
 * @example
 * // All product types
 * <WidgetRoot attributes={ attributes }>
 *     <SalesByDeviceWidget />
 * </WidgetRoot>
 *
 * @example
 * // Bookings only
 * <WidgetRoot attributes={ attributes }>
 *     <SalesByDeviceWidget filter={ BOOKINGS_FILTER } />
 * </WidgetRoot>
 */
export function SalesByDeviceWidget( { filter }: SalesByDeviceWidgetProps ) {
	const { reportParams } = useWidgetRootContext();

	// Add the device view to params
	const paramsWithView = useMemo(
		() => ( {
			...reportParams,
			view: 'device' as const,
			...( filter && { filters: [ filter ] } ),
		} ),
		[ reportParams, filter ]
	);

	const { primary, hasComparison, isLoading, isFetching, hasData, isError, error, refetch } =
		useReportOrderAttribution( paramsWithView );

	const isInitialLoading = isLoading && ! hasData;
	const isRefetching = isFetching && hasData;

	const { chartData } = useMemo(
		() => buildSalesByDeviceData( primary.data, hasComparison, reportParams ),
		[ primary.data, hasComparison, reportParams ]
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
				emptyStateIcon={ device }
			/>
			{ isRefetching && <WidgetLoadingOverlay /> }
		</>
	);
}
