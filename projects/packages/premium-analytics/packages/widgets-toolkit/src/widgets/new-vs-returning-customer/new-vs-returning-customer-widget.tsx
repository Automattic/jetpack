/**
 * External dependencies
 */
import { useReportCustomersByDate } from '@jetpack-premium-analytics/data';
import { customer } from '@jetpack-premium-analytics/icons';
import { __ } from '@wordpress/i18n';
import { useMemo } from 'react';
/**
 * Internal dependencies
 */
import { Donut, type DonutSegmentInput } from '../../components';
import { useWidgetRootContext } from '../../components/widget-root';
import { describeError } from '../../helpers';

/**
 * Unique customers of the period, returning against new. Renders inside a `WidgetRoot`, which
 * supplies `reportParams` through context.
 */
export function NewVsReturningCustomerWidget() {
	const { reportParams } = useWidgetRootContext();

	const {
		primary,
		comparison,
		hasComparison,
		isLoading,
		isFetching,
		hasData,
		isError,
		error,
		refetch,
	} = useReportCustomersByDate( reportParams );
	const summary = primary.data?.summary;
	const previous = comparison.data?.summary;

	// Returning first to match the design: the larger segment leads.
	const segments = useMemo< DonutSegmentInput[] >(
		() =>
			summary
				? [
						{
							label: __( 'Returning', 'jetpack-premium-analytics-pkg' ),
							value: summary.returning_customers,
							previousValue: previous?.returning_customers,
						},
						{
							label: __( 'New', 'jetpack-premium-analytics-pkg' ),
							value: summary.new_customers,
							previousValue: previous?.new_customers,
						},
					]
				: [],
		[ summary, previous ]
	);

	return (
		<Donut
			segments={ segments }
			status={ {
				isLoading,
				isFetching,
				// The report queries keep the previous period's data as placeholders across
				// range changes, so only surface the error when nothing else is showing.
				isError: isError && ! hasData,
				hasComparison,
				refetch,
			} }
			error={ describeError( error, {
				retryDescription: __(
					"We couldn't load customer data. Please try again in a moment.",
					'jetpack-premium-analytics-pkg'
				),
				onRetry: refetch,
			} ) }
			empty={ {
				icon: customer,
				description: __( 'No customer data in this period.', 'jetpack-premium-analytics-pkg' ),
			} }
		/>
	);
}
