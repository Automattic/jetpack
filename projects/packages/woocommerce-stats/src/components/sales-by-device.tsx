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
import { useReportOrderAttribution, type FilterCondition } from '../reports';

const CURRENCY_FORMAT: DataFormat = { type: 'currency', options: { useMultipliers: true } };

type SalesByDeviceProps = {
	/** The product types the sales count; every type when omitted. */
	filters?: FilterCondition[];
	/** The widget title; the chart is named "Chart: <title>". */
	chartTitle: string;
};

/**
 * Sales by device type, one column each per period, read under the widget root for its report
 * params. The attribution report carries both periods in one response.
 *
 * @param {SalesByDeviceProps} props - The component props.
 * @return {JSX.Element} The columns, or the loading, error or empty state of their report.
 */
export function SalesByDevice( { filters, chartTitle }: SalesByDeviceProps ) {
	const { reportParams } = useWidgetRootContext();
	const params = useMemo(
		() => ( { ...reportParams, view: 'device' as const, ...( filters && { filters } ) } ),
		[ reportParams, filters ]
	);
	const { primary, hasComparison, isLoading, isFetching, hasData, isError, error, refetch } =
		useReportOrderAttribution( params );

	const columns = useMemo< ColumnInput[] >(
		() =>
			( primary.data?.data ?? [] ).map( item => ( {
				label: item.item || __( 'Unassigned', 'jetpack-woocommerce-stats-pkg' ),
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
				// The queries keep the previous range's data on screen, so an error only shows without it.
				isError: isError && ! hasData,
				hasComparison,
				refetch,
			} }
			error={ describeError( error, {
				retryDescription: __(
					"We couldn't load sales by device data. Please try again in a moment.",
					'jetpack-woocommerce-stats-pkg'
				),
				onRetry: refetch,
			} ) }
			format={ CURRENCY_FORMAT }
			chartTitle={ chartTitle }
		/>
	);
}
