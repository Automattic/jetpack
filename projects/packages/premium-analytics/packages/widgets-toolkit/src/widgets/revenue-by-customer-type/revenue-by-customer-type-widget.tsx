/**
 * External dependencies
 */
import { useReportCustomers, type FilterCondition } from '@jetpack-premium-analytics/data';
import { customer } from '@jetpack-premium-analytics/icons';
import { __ } from '@wordpress/i18n';
import { useMemo } from 'react';
import { BarChart, WidgetState } from '../../components';
/**
 * Internal dependencies
 */
import { useWidgetRootContext } from '../../components/widget-root';
import { buildRevenueByCustomerTypeData, isEmptyChartData, BOOKINGS_FILTER } from '../../helpers';
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

	const { primary, comparison, isLoading, isFetching, hasData, isError, refetch } =
		useReportCustomers( {
			...reportParams,
			filters: filter ? [ filter ] : undefined,
		} );

	const { chartData } = useMemo(
		() => buildRevenueByCustomerTypeData( primary.data, comparison.data, reportParams ),
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
					"We couldn't load customer revenue data. Please try again in a moment.",
					'jetpack-premium-analytics'
				),
				actions: [ { label: __( 'Retry', 'jetpack-premium-analytics' ), onClick: refetch } ],
			} }
			empty={ {
				icon: customer,
				description: __( 'No customer revenue in this period.', 'jetpack-premium-analytics' ),
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
