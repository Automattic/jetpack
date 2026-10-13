/**
 * External dependencies
 */
import { useReportOrderAttribution, type FilterCondition } from '@jetpack-premium-analytics/data';
import { device } from '@jetpack-premium-analytics/icons';
import { __ } from '@wordpress/i18n';
import { useMemo } from 'react';
/**
 * Internal dependencies
 */
import { Columns, type ColumnInput } from '../../components/columns';
import { useWidgetRootContext } from '../../components/widget-root';

const CURRENCY_FORMAT = { type: 'currency' as const, options: { useMultipliers: true } };

type SalesByDeviceWidgetProps = {
	/**
	 * Optional product type filter to apply when fetching order attribution data.
	 *
	 * When provided, filters results to specific product types (e.g., bookings only).
	 * When omitted, shows data for all product types.
	 */
	filter?: FilterCondition;

	emptyStateText?: string;

	errorText?: string;
};

/**
 * Sales by device type (Desktop, Mobile, Tablet), one column each per period.
 *
 * Must render within a WidgetRoot, which provides reportParams via context.
 */
export function SalesByDeviceWidget( {
	filter,
	emptyStateText,
	errorText,
}: SalesByDeviceWidgetProps ) {
	const { reportParams } = useWidgetRootContext();

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

	// The attribution report carries both periods in one response.
	const columns = useMemo< ColumnInput[] >(
		() =>
			( primary.data?.data ?? [] ).map( item => ( {
				label: item.item || __( 'Unassigned', 'jetpack-premium-analytics-pkg' ),
				value: item.current_period?.value ?? 0,
				previousValue: item.previous_period?.value,
			} ) ),
		[ primary.data ]
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
				description:
					errorText ??
					__(
						"We couldn't load sales by device data. Please try again in a moment.",
						'jetpack-premium-analytics-pkg'
					),
				actions: [ { label: __( 'Retry', 'jetpack-premium-analytics-pkg' ), onClick: refetch } ],
			} }
			empty={ {
				icon: device,
				description:
					emptyStateText ?? __( 'No sales data in this period.', 'jetpack-premium-analytics-pkg' ),
			} }
			format={ CURRENCY_FORMAT }
		/>
	);
}
