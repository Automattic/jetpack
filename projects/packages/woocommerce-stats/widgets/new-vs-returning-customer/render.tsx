/**
 * External dependencies
 */
import {
	Donut,
	describeError,
	useWidgetRootContext,
	WidgetRoot,
	type DonutSegmentInput,
	type ReportParamsFieldAttributes,
} from '@automattic/jetpack-premium-analytics-sdk';
import { __ } from '@wordpress/i18n';
import { people } from '@wordpress/icons';
import { useMemo } from 'react';
/**
 * Internal dependencies
 */
import { useReportCustomersByDate } from '../../src/reports';
import type { NewVsReturningCustomerAttributes } from './widget';
import type { WidgetRenderProps } from '@wordpress/widget-primitives';

type NewVsReturningCustomerRenderAttributes = NewVsReturningCustomerAttributes &
	Partial< ReportParamsFieldAttributes >;

/**
 * Unique customers of the period, returning against new, read under the widget root for its
 * report params.
 *
 * @return {JSX.Element} The breakdown.
 */
function NewVsReturningCustomer() {
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
							label: __( 'Returning', 'jetpack-woocommerce-stats-pkg' ),
							value: summary.returning_customers,
							previousValue: previous?.returning_customers,
						},
						{
							label: __( 'New', 'jetpack-woocommerce-stats-pkg' ),
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
				// The queries keep the previous range's data on screen, so an error only shows without it.
				isError: isError && ! hasData,
				hasComparison,
				refetch,
			} }
			error={ describeError( error, {
				retryDescription: __(
					"We couldn't load customer data. Please try again in a moment.",
					'jetpack-woocommerce-stats-pkg'
				),
				onRetry: refetch,
			} ) }
			empty={ {
				icon: people,
				description: __( 'No customer data in this period.', 'jetpack-woocommerce-stats-pkg' ),
			} }
		/>
	);
}

/**
 * The New vs returning customer widget.
 *
 * @param {WidgetRenderProps< NewVsReturningCustomerRenderAttributes >} props - The props the host passes.
 * @return {JSX.Element} The widget.
 */
export default function NewVsReturningCustomerRender( {
	attributes = {},
}: WidgetRenderProps< NewVsReturningCustomerRenderAttributes > ) {
	return (
		<WidgetRoot attributes={ attributes }>
			<NewVsReturningCustomer />
		</WidgetRoot>
	);
}
