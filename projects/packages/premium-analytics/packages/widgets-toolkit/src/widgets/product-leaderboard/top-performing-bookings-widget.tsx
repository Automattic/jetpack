/**
 * External dependencies
 */
import { calendar } from '@jetpack-premium-analytics/icons';
/**
 * Internal dependencies
 */
import { BOOKINGS_FILTER } from '../../helpers';
import { TopPerformingProductLeaderboardWidget } from './top-performing-product-leaderboard-widget';

export type TopPerformingBookingsWidgetProps = {
	/**
	 * Maximum number of bookings to display
	 */
	limit?: number;
};

/**
 * Top Performing Bookings Widget
 *
 * Displays the top-performing booking products by net revenue in a leaderboard format.
 * Shows product images, names, and revenue with comparison to previous period.
 *
 * Filters to: booking, bookable-event, and bookable-service product types.
 *
 * Features:
 * - Automatic booking product data fetching
 * - Product image loading
 * - Revenue-based ranking
 * - Comparison support
 *
 * Must be used within a WidgetRoot which provides reportParams via context.
 *
 * @param props       - Component props
 * @param props.limit - Maximum number of bookings to display (default: 5)
 *
 * @example
 * <WidgetRoot attributes={ attributes }>
 *   <TopPerformingBookingsWidget limit={ 5 } />
 * </WidgetRoot>
 */
export function TopPerformingBookingsWidget( { limit = 5 }: TopPerformingBookingsWidgetProps ) {
	return (
		<TopPerformingProductLeaderboardWidget
			limit={ limit }
			filter={ BOOKINGS_FILTER }
			emptyStateIcon={ calendar }
		/>
	);
}
