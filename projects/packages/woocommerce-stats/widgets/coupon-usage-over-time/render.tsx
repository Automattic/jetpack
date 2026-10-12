/**
 * External dependencies
 */
import {
	Donut,
	describeError,
	useWidgetRootContext,
	WidgetRoot,
	type DataFormat,
	type DonutSegmentInput,
	type ReportParamsFieldAttributes,
} from '@automattic/jetpack-premium-analytics-sdk';
import { __ } from '@wordpress/i18n';
import { tag } from '@wordpress/icons';
import { useMemo } from 'react';
/**
 * Internal dependencies
 */
import { useReportCouponsByDate } from '../../src/reports';
import type { CouponUsageOverTimeAttributes } from './widget';
import type { WidgetRenderProps } from '@wordpress/widget-primitives';

type CouponUsageOverTimeRenderAttributes = CouponUsageOverTimeAttributes &
	Partial< ReportParamsFieldAttributes >;

const CURRENCY_FORMAT: DataFormat = { type: 'currency', options: { useMultipliers: true } };

/**
 * Sales with a coupon against sales without one, read under the widget root for its report params.
 *
 * @return {JSX.Element} The breakdown.
 */
function CouponUsageOverTime() {
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
	} = useReportCouponsByDate( reportParams );
	const summary = primary.data?.summary;
	const previous = comparison.data?.summary;

	const segments = useMemo< DonutSegmentInput[] >(
		() =>
			summary
				? [
						{
							label: __( 'With coupons', 'jetpack-woocommerce-stats-pkg' ),
							value: summary.sales_with_coupon,
							previousValue: previous?.sales_with_coupon,
						},
						{
							label: __( 'No coupons', 'jetpack-woocommerce-stats-pkg' ),
							value: summary.sales_without_coupon,
							previousValue: previous?.sales_without_coupon,
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
					"We couldn't load coupon data. Please try again in a moment.",
					'jetpack-woocommerce-stats-pkg'
				),
				onRetry: refetch,
			} ) }
			empty={ {
				icon: tag,
				description: __( 'No coupon usage in this period.', 'jetpack-woocommerce-stats-pkg' ),
			} }
			format={ CURRENCY_FORMAT }
		/>
	);
}

/**
 * The Coupon usage over time widget.
 *
 * @param {WidgetRenderProps< CouponUsageOverTimeRenderAttributes >} props - The props the host passes.
 * @return {JSX.Element} The widget.
 */
export default function CouponUsageOverTimeRender( {
	attributes = {},
}: WidgetRenderProps< CouponUsageOverTimeRenderAttributes > ) {
	return (
		<WidgetRoot attributes={ attributes }>
			<CouponUsageOverTime />
		</WidgetRoot>
	);
}
