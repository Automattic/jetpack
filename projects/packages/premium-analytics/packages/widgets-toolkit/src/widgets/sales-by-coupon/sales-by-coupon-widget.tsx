/**
 * External dependencies
 */
import { useReportCoupons } from '@jetpack-premium-analytics/data';
import { coupon } from '@jetpack-premium-analytics/icons';
import { __ } from '@wordpress/i18n';
import { useMemo } from 'react';
/**
 * Internal dependencies
 */
import { Columns } from '../../components/columns';
import { useWidgetRootContext } from '../../components/widget-root';
import { buildSalesByCouponColumns } from './build-sales-by-coupon-columns';

const CURRENCY_FORMAT = { type: 'currency' as const, options: { useMultipliers: true } };

/** Top coupons charted individually; the rest are summed into an "Other" column. */
const TOP_COUPON_SEGMENTS = 3;

/**
 * Sales of the top coupons and of the rest as Other, one column each per period.
 *
 * Must be used within a WidgetRoot which provides reportParams via context.
 */
export function SalesByCouponWidget() {
	const { reportParams } = useWidgetRootContext();

	const { primary, comparison, hasComparison, isLoading, isFetching, hasData, isError, refetch } =
		useReportCoupons( reportParams );

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
				// The report queries keep the previous range's data on screen, so an error only shows without it.
				isError: isError && ! hasData,
				hasComparison,
				refetch,
			} }
			error={ {
				description: __(
					"We couldn't load coupon sales data. Please try again in a moment.",
					'jetpack-premium-analytics-pkg'
				),
				actions: [ { label: __( 'Retry', 'jetpack-premium-analytics-pkg' ), onClick: refetch } ],
			} }
			empty={ {
				icon: coupon,
				description: __( 'No coupon sales in this period.', 'jetpack-premium-analytics-pkg' ),
			} }
			format={ CURRENCY_FORMAT }
		/>
	);
}
