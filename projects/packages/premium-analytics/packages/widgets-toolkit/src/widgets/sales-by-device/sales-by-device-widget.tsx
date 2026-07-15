/**
 * External dependencies
 */
import { useReportOrderAttribution, type FilterCondition } from '@jetpack-premium-analytics/data';
import { device } from '@jetpack-premium-analytics/icons';
import { __ } from '@wordpress/i18n';
import { useMemo } from 'react';
import { BarChart, WidgetState } from '../../components';
/**
 * Internal dependencies
 */
import { useWidgetRootContext } from '../../components/widget-root';
import { buildSalesByDeviceData, isEmptyChartData } from '../../helpers';
import { useBarStyles } from '../common';

type SalesByDeviceWidgetProps = {
	/**
	 * Optional product type filter to apply when fetching order attribution data.
	 *
	 * When provided, filters results to specific product types (e.g., bookings only).
	 * When omitted, shows data for all product types.
	 */
	filter?: FilterCondition;

	/**
	 * Copy for the empty state.
	 */
	emptyStateText?: string;

	/**
	 * Copy for the error state.
	 */
	errorText?: string;
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
 * @param props                - Component props
 * @param props.filter         - Optional product type filter
 * @param props.emptyStateText - Copy for the empty state
 * @param props.errorText      - Copy for the error state
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
export function SalesByDeviceWidget( {
	filter,
	emptyStateText,
	errorText,
}: SalesByDeviceWidgetProps ) {
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

	const { primary, hasComparison, isLoading, isFetching, hasData, isError, refetch } =
		useReportOrderAttribution( paramsWithView );

	const { chartData } = useMemo(
		() => buildSalesByDeviceData( primary.data, hasComparison, reportParams ),
		[ primary.data, hasComparison, reportParams ]
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
				description:
					errorText ??
					__(
						"We couldn't load sales by device data. Please try again in a moment.",
						'jetpack-premium-analytics'
					),
				actions: [ { label: __( 'Retry', 'jetpack-premium-analytics' ), onClick: refetch } ],
			} }
			empty={ {
				icon: device,
				description:
					emptyStateText ?? __( 'No sales data in this period.', 'jetpack-premium-analytics' ),
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
