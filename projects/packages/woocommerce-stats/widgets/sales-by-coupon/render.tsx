/**
 * External dependencies
 */
import {
	Columns,
	describeError,
	useWidgetRootContext,
	WidgetRoot,
	type DataFormat,
	type ReportParamsFieldAttributes,
} from '@automattic/jetpack-premium-analytics-sdk';
import { __ } from '@wordpress/i18n';
import { useMemo } from 'react';
/**
 * Internal dependencies
 */
import { useReportCoupons } from '../../src/reports';
import { buildSalesByCouponColumns } from './build-sales-by-coupon-columns';
import type { WidgetRenderProps } from '@wordpress/widget-primitives';

/**
 * No configurable attributes; the empty record allows host-provided fields, such as the report
 * params.
 */
export type SalesByCouponAttributes = Record< never, never >;

type SalesByCouponRenderAttributes = SalesByCouponAttributes &
	Partial< ReportParamsFieldAttributes >;

const CURRENCY_FORMAT: DataFormat = { type: 'currency', options: { useMultipliers: true } };

/** Top coupons charted individually; the rest are summed into an "Other" column. */
const TOP_COUPON_SEGMENTS = 3;

/**
 * Sales of the top coupons and of the rest as Other, one column each per period, read under the
 * widget root for its report params.
 *
 * @return {JSX.Element} The columns, or the loading, error or empty state of their report.
 */
function SalesByCoupon() {
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
	} = useReportCoupons( reportParams );

	const columns = useMemo(
		() =>
			buildSalesByCouponColumns( primary.data?.data, comparison.data?.data, TOP_COUPON_SEGMENTS ),
		[ primary.data, comparison.data ]
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
					"We couldn't load coupon sales data. Please try again in a moment.",
					'jetpack-woocommerce-stats-pkg'
				),
				onRetry: refetch,
			} ) }
			format={ CURRENCY_FORMAT }
			chartTitle={ __( 'Sales by coupon', 'jetpack-woocommerce-stats-pkg' ) }
		/>
	);
}

/**
 * The Sales by coupon widget.
 *
 * @param {WidgetRenderProps< SalesByCouponRenderAttributes >} props - The props the host passes.
 * @return {JSX.Element} The widget.
 */
export default function SalesByCouponRender( {
	attributes = {},
}: WidgetRenderProps< SalesByCouponRenderAttributes > ) {
	return (
		<WidgetRoot attributes={ attributes }>
			<SalesByCoupon />
		</WidgetRoot>
	);
}
