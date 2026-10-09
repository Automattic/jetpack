/**
 * External dependencies
 */
import {
	WidgetRoot,
	type ReportParamsFieldAttributes,
} from '@automattic/jetpack-premium-analytics-sdk';
import { __ } from '@wordpress/i18n';
import { calendar } from '@wordpress/icons';
/**
 * Internal dependencies
 */
import { ProductLeaderboard } from '../../src/components/product-leaderboard';
import { BOOKINGS_FILTER } from '../../src/reports';
import type { TopPerformingBookingsAttributes } from './widget';
import type { WidgetRenderProps } from '@wordpress/widget-primitives';

type TopPerformingBookingsRenderAttributes = TopPerformingBookingsAttributes &
	Partial< ReportParamsFieldAttributes >;

/**
 * The Top performing bookings widget: booking products by net revenue.
 *
 * @param {WidgetRenderProps< TopPerformingBookingsRenderAttributes >} props - The props the host passes.
 * @return {JSX.Element} The widget.
 */
export default function TopPerformingBookingsRender( {
	attributes = {},
}: WidgetRenderProps< TopPerformingBookingsRenderAttributes > ) {
	return (
		<WidgetRoot attributes={ attributes }>
			<ProductLeaderboard
				filter={ BOOKINGS_FILTER }
				emptyIcon={ calendar }
				emptyText={ __( 'No booking sales in this period.', 'jetpack-woocommerce-stats-pkg' ) }
				errorText={ __(
					"We couldn't load bookings data. Please try again in a moment.",
					'jetpack-woocommerce-stats-pkg'
				) }
			/>
		</WidgetRoot>
	);
}
