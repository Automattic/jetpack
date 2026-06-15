/**
 * Internal dependencies
 */
import { PHYSICAL_PRODUCTS_FILTER } from '../../helpers';
import { TopPerformingProductLeaderboardWidget } from './top-performing-product-leaderboard-widget';

export type TopPerformingProductsWidgetProps = {
	/**
	 * Maximum number of products to display
	 */
	limit?: number;
};

/**
 * Top Performing Products Widget
 *
 * Displays the top-performing physical products by net revenue in a leaderboard format.
 * Shows product images, names, and revenue with comparison to previous period.
 *
 * Filters to: simple, variable, and variation product types (physical products only).
 *
 * Features:
 * - Automatic product data fetching
 * - Product image loading
 * - Revenue-based ranking
 * - Comparison support
 *
 * Must be used within a WidgetRoot which provides reportParams via context.
 *
 * @param props       - Component props
 * @param props.limit - Maximum number of products to display (default: 5)
 *
 * @example
 * <WidgetRoot attributes={ attributes }>
 *   <TopPerformingProductsWidget limit={ 5 } />
 * </WidgetRoot>
 */
export function TopPerformingProductsWidget( { limit = 5 }: TopPerformingProductsWidgetProps ) {
	return (
		<TopPerformingProductLeaderboardWidget limit={ limit } filter={ PHYSICAL_PRODUCTS_FILTER } />
	);
}
