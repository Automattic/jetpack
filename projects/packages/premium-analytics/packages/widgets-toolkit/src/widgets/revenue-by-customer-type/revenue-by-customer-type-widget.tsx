/**
 * External dependencies
 */
import { useReportCustomers, type FilterCondition } from '@jetpack-premium-analytics/data';
import { customer } from '@jetpack-premium-analytics/icons';
import { useMemo } from 'react';
import { BarChart } from '../../components';
import { WidgetLoadingOverlay } from '../../components/widget-loading-overlay';
/**
 * Internal dependencies
 */
import { useWidgetRootContext } from '../../components/widget-root';
import { buildRevenueByCustomerTypeData, BOOKINGS_FILTER } from '../../helpers';
import { useWidgetError } from '../../hooks';
import { useBarStyles } from '../common';

type CustomerTypeRevenueWidgetProps = {
	/**
	 * Optional product type filter to apply when fetching customer data.
	 * If not provided, will show data for all product types.
	 *
	 * @see PHYSICAL_PRODUCTS_FILTER for physical goods (simple, variable, variation)
	 * @see BOOKINGS_FILTER for booking products (booking, bookable-event, bookable-service)
	 */
	filter?: FilterCondition;
};

/**
 * Customer Type Revenue Widget Component
 *
 * Displays a bar chart comparing revenue from new customers vs returning customers.
 * Optionally supports filtering by product type.
 *
 * Must be used within a WidgetRoot which provides reportParams via context.
 *
 * @example
 * ```tsx
 * <WidgetRoot attributes={ attributes }>
 *     <CustomerTypeRevenueWidget filter={ BOOKINGS_FILTER } />
 * </WidgetRoot>
 * ```
 */
function CustomerTypeRevenueWidget( { filter }: CustomerTypeRevenueWidgetProps ) {
	const { reportParams } = useWidgetRootContext();

	const { primary, comparison, isLoading, isFetching, hasData, isError, error, refetch } =
		useReportCustomers( {
			...reportParams,
			filters: filter ? [ filter ] : undefined,
		} );

	const isInitialLoading = isLoading && ! hasData;
	const isRefetching = isFetching && hasData;

	const { chartData } = useMemo(
		() => buildRevenueByCustomerTypeData( primary.data, comparison.data, reportParams ),
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
				emptyStateIcon={ customer }
			/>
			{ isRefetching && <WidgetLoadingOverlay /> }
		</>
	);
}

/**
 * Revenue by Customer Type Widget
 *
 * Displays customer revenue data for all product types.
 * No product type filtering applied.
 */
export function RevenueByCustomerTypeWidget() {
	return <CustomerTypeRevenueWidget />;
}

/**
 * Bookings Revenue by Customer Type Widget
 *
 * Displays customer revenue data for booking products only.
 * Filters to: booking, bookable-event, and bookable-service product types.
 */
export function BookingsRevenueByCustomerTypeWidget() {
	return <CustomerTypeRevenueWidget filter={ BOOKINGS_FILTER } />;
}
