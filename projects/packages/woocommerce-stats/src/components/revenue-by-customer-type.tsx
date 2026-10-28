/**
 * External dependencies
 */
import {
	Columns,
	describeError,
	useWidgetRootContext,
	type ColumnInput,
	type DataFormat,
} from '@automattic/jetpack-premium-analytics-sdk';
import { __ } from '@wordpress/i18n';
import { useMemo } from 'react';
/**
 * Internal dependencies
 */
import { useReportCustomers, type FilterCondition } from '../reports';

const CURRENCY_FORMAT: DataFormat = { type: 'currency', options: { useMultipliers: true } };

type RevenueByCustomerTypeProps = {
	/** The product types the revenue counts; every type when omitted. */
	filters?: FilterCondition[];
	/** The widget title; the chart is named "Chart: <title>". */
	chartTitle: string;
};

/**
 * Revenue from returning customers against new ones, one column each per period, read under
 * the widget root for its report params.
 *
 * @param {RevenueByCustomerTypeProps} props - The component props.
 * @return {JSX.Element} The columns, or the loading, error or empty state of their report.
 */
export function RevenueByCustomerType( { filters, chartTitle }: RevenueByCustomerTypeProps ) {
	const { reportParams } = useWidgetRootContext();
	const params = useMemo(
		() => ( filters ? { ...reportParams, filters } : reportParams ),
		[ reportParams, filters ]
	);
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
	} = useReportCustomers( params );
	const summary = primary.data?.summary;
	const previous = comparison.data?.summary;

	// The categories are fixed, so the skeleton knows its two columns before the data arrives.
	const columns = useMemo< ColumnInput[] >(
		() => [
			{
				label: __( 'Returning', 'jetpack-woocommerce-stats-pkg' ),
				value: summary?.returning_customer_sales ?? 0,
				previousValue: previous?.returning_customer_sales,
			},
			{
				label: __( 'New', 'jetpack-woocommerce-stats-pkg' ),
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
				// The queries keep the previous range's data on screen, so an error only shows without it.
				isError: isError && ! hasData,
				hasComparison,
				refetch,
			} }
			error={ describeError( error, {
				retryDescription: __(
					"We couldn't load customer revenue data. Please try again in a moment.",
					'jetpack-woocommerce-stats-pkg'
				),
				onRetry: refetch,
			} ) }
			format={ CURRENCY_FORMAT }
			chartTitle={ chartTitle }
		/>
	);
}
