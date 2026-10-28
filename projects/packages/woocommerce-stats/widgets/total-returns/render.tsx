/**
 * External dependencies
 */
import {
	Columns,
	describeError,
	useWidgetRootContext,
	WidgetRoot,
	type ColumnInput,
	type DataFormat,
	type ReportParamsFieldAttributes,
} from '@automattic/jetpack-premium-analytics-sdk';
import { __ } from '@wordpress/i18n';
import { useMemo } from 'react';
/**
 * Internal dependencies
 */
import { useReportOrders } from '../../src/reports';
import type { WidgetRenderProps } from '@wordpress/widget-primitives';

/**
 * No configurable attributes; the empty record allows host-provided fields, such as the report
 * params.
 */
export type TotalReturnsAttributes = Record< never, never >;

type TotalReturnsRenderAttributes = TotalReturnsAttributes & Partial< ReportParamsFieldAttributes >;

const CURRENCY_FORMAT: DataFormat = { type: 'currency', options: { useMultipliers: true } };

type OrdersSummary = { total_sales?: number; refunds?: number };

const salesNetOfRefunds = ( summary: OrdersSummary ) =>
	Math.max( 0, ( summary.total_sales ?? 0 ) - ( summary.refunds ?? 0 ) );

/**
 * Refunds beside the sales net of them, one column each per period, read under the widget root
 * for its report params. A period pair without a refund reads as empty rather than as sales
 * labelled returns.
 *
 * @return {JSX.Element} The columns, or the loading, error or empty state of their report.
 */
function TotalReturns() {
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
	} = useReportOrders( reportParams );
	const summary = primary.data?.summary;
	const previous = comparison.data?.summary;

	const columns = useMemo< ColumnInput[] >( () => {
		if ( summary && ! summary.refunds && ! previous?.refunds ) {
			return [];
		}

		// The categories are fixed, so the skeleton knows its two columns before the data arrives.
		return [
			{
				label: __( 'Total sales', 'jetpack-woocommerce-stats-pkg' ),
				value: summary ? salesNetOfRefunds( summary ) : 0,
				previousValue: previous ? salesNetOfRefunds( previous ) : undefined,
			},
			{
				label: __( 'Refunds', 'jetpack-woocommerce-stats-pkg' ),
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
				// The queries keep the previous range's data on screen, so an error only shows without it.
				isError: isError && ! hasData,
				hasComparison,
				refetch,
			} }
			error={ describeError( error, {
				retryDescription: __(
					"We couldn't load returns data. Please try again in a moment.",
					'jetpack-woocommerce-stats-pkg'
				),
				onRetry: refetch,
			} ) }
			format={ CURRENCY_FORMAT }
			chartTitle={ __( 'Total returns', 'jetpack-woocommerce-stats-pkg' ) }
		/>
	);
}

/**
 * The Total returns widget.
 *
 * @param {WidgetRenderProps< TotalReturnsRenderAttributes >} props - The props the host passes.
 * @return {JSX.Element} The widget.
 */
export default function TotalReturnsRender( {
	attributes = {},
}: WidgetRenderProps< TotalReturnsRenderAttributes > ) {
	return (
		<WidgetRoot attributes={ attributes }>
			<TotalReturns />
		</WidgetRoot>
	);
}
