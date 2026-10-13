/**
 * External dependencies
 */
import { useReportCustomers, type FilterCondition } from '@jetpack-premium-analytics/data';
import { customer } from '@jetpack-premium-analytics/icons';
import { __ } from '@wordpress/i18n';
import { useMemo } from 'react';
/**
 * Internal dependencies
 */
import { Columns, type ColumnInput } from '../../components/columns';
import { useWidgetRootContext } from '../../components/widget-root';
import { BOOKINGS_FILTER } from '../../helpers';

const CURRENCY_FORMAT = { type: 'currency' as const, options: { useMultipliers: true } };

type CustomerTypeRevenueWidgetProps = {
	/**
	 * Optional product type filter to apply when fetching customer data.
	 * If not provided, will show data for all product types.
	 *
	 * @see BOOKINGS_FILTER for booking products (booking, bookable-event, bookable-service)
	 */
	filter?: FilterCondition;
};

/**
 * Revenue from returning customers against new ones, one column each per period.
 *
 * Must be used within a WidgetRoot which provides reportParams via context.
 */
function CustomerTypeRevenueWidget( { filter }: CustomerTypeRevenueWidgetProps ) {
	const { reportParams } = useWidgetRootContext();

	const { primary, comparison, hasComparison, isLoading, isFetching, hasData, isError, refetch } =
		useReportCustomers( {
			...reportParams,
			filters: filter ? [ filter ] : undefined,
		} );
	const summary = primary.data?.summary;
	const previous = comparison.data?.summary;

	// The categories are fixed, so the skeleton knows its two columns before the data arrives.
	const columns = useMemo< ColumnInput[] >(
		() => [
			{
				label: __( 'Returning', 'jetpack-premium-analytics-pkg' ),
				value: summary?.returning_customer_sales ?? 0,
				previousValue: previous?.returning_customer_sales,
			},
			{
				label: __( 'New', 'jetpack-premium-analytics-pkg' ),
				value: summary?.new_customer_sales ?? 0,
				previousValue: previous?.new_customer_sales,
			},
		],
		[ summary, previous ]
	);

	return (
		<Columns
			columns={ columns }
			status={ {
				isLoading,
				isFetching,
				// The report queries keep the previous range's data on screen, so an error only shows without it.
				isError: isError && ! hasData,
				hasComparison,
				refetch,
			} }
			error={ {
				description: __(
					"We couldn't load customer revenue data. Please try again in a moment.",
					'jetpack-premium-analytics-pkg'
				),
				actions: [ { label: __( 'Retry', 'jetpack-premium-analytics-pkg' ), onClick: refetch } ],
			} }
			empty={ {
				icon: customer,
				description: __( 'No customer revenue in this period.', 'jetpack-premium-analytics-pkg' ),
			} }
			format={ CURRENCY_FORMAT }
		/>
	);
}

/**
 * Displays customer revenue data for all product types.
 * No product type filtering applied.
 */
export function RevenueByCustomerTypeWidget() {
	return <CustomerTypeRevenueWidget />;
}

/**
 * Displays customer revenue data for booking products only.
 * Filters to: booking, bookable-event, and bookable-service product types.
 */
export function BookingsRevenueByCustomerTypeWidget() {
	return <CustomerTypeRevenueWidget filter={ BOOKINGS_FILTER } />;
}
