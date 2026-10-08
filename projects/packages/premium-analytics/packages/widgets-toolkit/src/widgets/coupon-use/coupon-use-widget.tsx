/**
 * External dependencies
 */
import { useReportCouponsByDate } from '@jetpack-premium-analytics/data';
import { coupon } from '@jetpack-premium-analytics/icons';
import { __ } from '@wordpress/i18n';
import { useMemo } from 'react';
/**
 * Internal dependencies
 */
import { Donut, type DonutSegmentInput } from '../../components';
import { useWidgetRootContext } from '../../components/widget-root';
import { describeError } from '../../helpers';
import type { DataFormat } from '../../types';

const CURRENCY_FORMAT: DataFormat = { type: 'currency', options: { useMultipliers: true } };

/**
 * Sales with a coupon against sales without one. Renders inside a `WidgetRoot`, which supplies
 * `reportParams` through context.
 */
export function CouponUseWidget() {
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
							label: __( 'With coupons', 'jetpack-premium-analytics-pkg' ),
							value: summary.sales_with_coupon,
							previousValue: previous?.sales_with_coupon,
						},
						{
							label: __( 'No coupons', 'jetpack-premium-analytics-pkg' ),
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
				// The report queries keep placeholders from the previous period across
				// range changes, so only surface the error when nothing is left to show.
				isError: isError && ! hasData,
				hasComparison,
				refetch,
			} }
			error={ describeError( error, {
				retryDescription: __(
					"We couldn't load coupon data. Please try again in a moment.",
					'jetpack-premium-analytics-pkg'
				),
				onRetry: refetch,
			} ) }
			empty={ {
				icon: coupon,
				description: __( 'No coupon usage in this period.', 'jetpack-premium-analytics-pkg' ),
			} }
			format={ CURRENCY_FORMAT }
		/>
	);
}
