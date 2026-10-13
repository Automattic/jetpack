/**
 * External dependencies
 */
import { useReportOrders, type ReportDataMap } from '@jetpack-premium-analytics/data';
import { paymentReturn } from '@jetpack-premium-analytics/icons';
import { __ } from '@wordpress/i18n';
import { useMemo } from 'react';
/**
 * Internal dependencies
 */
import { Columns, type ColumnInput } from '../../components/columns';
import { useWidgetRootContext } from '../../components/widget-root';

const CURRENCY_FORMAT = { type: 'currency' as const, options: { useMultipliers: true } };

type OrdersSummary = Pick< ReportDataMap[ 'orders' ][ 'summary' ], 'total_sales' | 'refunds' >;

const salesNetOfRefunds = ( summary: OrdersSummary ) =>
	Math.max( 0, summary.total_sales - summary.refunds );

/**
 * Refunds beside the sales net of them, one column each per period. A period pair without a
 * refund reads as empty rather than as sales labelled returns.
 *
 * Must be used within a WidgetRoot which provides reportParams via context.
 */
export function TotalReturnsWidget() {
	const { reportParams } = useWidgetRootContext();

	const { primary, comparison, hasComparison, isLoading, isFetching, hasData, isError, refetch } =
		useReportOrders( reportParams );
	const summary = primary.data?.summary;
	const previous = comparison.data?.summary;

	const columns = useMemo< ColumnInput[] >( () => {
		if ( summary && ! summary.refunds && ! previous?.refunds ) {
			return [];
		}

		// The categories are fixed, so the skeleton knows its two columns before the data arrives.
		return [
			{
				label: __( 'Total sales', 'jetpack-premium-analytics-pkg' ),
				value: summary ? salesNetOfRefunds( summary ) : 0,
				previousValue: previous ? salesNetOfRefunds( previous ) : undefined,
			},
			{
				label: __( 'Refunds', 'jetpack-premium-analytics-pkg' ),
				value: summary?.refunds ?? 0,
				previousValue: previous?.refunds,
			},
		];
	}, [ summary, previous ] );

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
					"We couldn't load returns data. Please try again in a moment.",
					'jetpack-premium-analytics-pkg'
				),
				actions: [ { label: __( 'Retry', 'jetpack-premium-analytics-pkg' ), onClick: refetch } ],
			} }
			empty={ {
				icon: paymentReturn,
				description: __( 'No returns in this period.', 'jetpack-premium-analytics-pkg' ),
			} }
			format={ CURRENCY_FORMAT }
		/>
	);
}
