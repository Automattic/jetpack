/**
 * External dependencies
 */
import {
	WidgetRoot,
	type ReportParamsFieldAttributes,
} from '@automattic/jetpack-premium-analytics-sdk';
import { __ } from '@wordpress/i18n';
/**
 * Internal dependencies
 */
import { ProductLeaderboard } from '../../src/components/product-leaderboard';
import { BOOKINGS_FILTER } from '../../src/reports';
import type { WidgetRenderProps } from '@wordpress/widget-primitives';

/**
 * No configurable attributes; the empty record allows host-provided fields, such as the report
 * params.
 */
export type TopPerformingBookingsAttributes = Record< never, never >;

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
				chartTitle={ __( 'Top performing bookings', 'jetpack-woocommerce-stats-pkg' ) }
				filter={ BOOKINGS_FILTER }
				errorText={ __(
					"We couldn't load bookings data. Please try again in a moment.",
					'jetpack-woocommerce-stats-pkg'
				) }
			/>
		</WidgetRoot>
	);
}
