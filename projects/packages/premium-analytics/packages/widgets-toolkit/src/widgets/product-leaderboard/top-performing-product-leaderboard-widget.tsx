/**
 * External dependencies
 */
import {
	useReportProducts,
	useProductImages,
	type FilterCondition,
} from '@jetpack-premium-analytics/data';
import { productBlouse } from '@jetpack-premium-analytics/icons';
import { Icon } from '@wordpress/ui';
import { useMemo } from 'react';
import { LeaderboardChart, LeaderboardLabel } from '../../components/chart-leaderboard';
import { WidgetLoadingOverlay } from '../../components/widget-loading-overlay';
/**
 * Internal dependencies
 */
import { useWidgetRootContext } from '../../components/widget-root';
import { formatLegendLabels, calculateDelta } from '../../helpers';
import { useWidgetError } from '../../hooks';

export type TopPerformingProductLeaderboardWidgetProps = {
	/**
	 * Maximum number of products to display
	 */
	limit?: number;

	/**
	 * Optional product type filter to apply when fetching product data.
	 *
	 * When provided, filters results to specific product types (e.g., bookings only).
	 * When omitted, shows data for all product types.
	 */
	filter?: FilterCondition;

	/**
	 * Icon to display in the empty state.
	 * Defaults to productBlouse icon.
	 */
	emptyStateIcon?: React.ComponentProps< typeof Icon >[ 'icon' ];
};

/**
 * Top Performing Product Leaderboard Widget
 *
 * Displays top-performing products by net revenue in a leaderboard format.
 * Shows product images, names, and revenue with comparison to previous period.
 *
 * This is a reusable component that can be used for any product-based leaderboard
 * (regular products, bookings, etc.).
 *
 * Features:
 * - Automatic product data fetching
 * - Product image loading
 * - Revenue-based ranking
 * - Comparison support
 * - Product type filtering
 *
 * Must be used within a WidgetRoot which provides reportParams via context.
 *
 * @param props                - Component props
 * @param props.limit          - Maximum number of products to display (default: 5)
 * @param props.filter         - Optional product type filter
 * @param props.emptyStateIcon - Icon to display in empty state (default: productBlouse)
 *
 * @example
 * // All product types
 * <WidgetRoot attributes={ attributes }>
 *   <TopPerformingProductLeaderboardWidget limit={ 5 } />
 * </WidgetRoot>
 *
 * @example
 * // Bookings only
 * <WidgetRoot attributes={ attributes }>
 *   <TopPerformingProductLeaderboardWidget
 *     limit={ 5 }
 *     filter={ BOOKINGS_FILTER }
 *   />
 * </WidgetRoot>
 */
export function TopPerformingProductLeaderboardWidget( {
	limit = 5,
	filter,
	emptyStateIcon = productBlouse,
}: TopPerformingProductLeaderboardWidgetProps ) {
	const { reportParams } = useWidgetRootContext();

	const params = useMemo(
		() => ( {
			...reportParams,
			...( filter && { filters: [ filter ] } ),
		} ),
		[ reportParams, filter ]
	);

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
	} = useReportProducts( params, limit );

	const { data } = primary;
	const { data: comparisonData } = comparison;

	// Extract product IDs for fetching images
	const productIds = useMemo(
		() => data?.data?.map( item => item.product_id ) || [],
		[ data?.data ]
	);

	// Fetch product images
	const { data: productImages, isLoading: imagesLoading } = useProductImages( {
		productIds,
	} );

	const isInitialLoading = ( isLoading || imagesLoading ) && ! hasData;
	const isRefetching = ( isFetching || imagesLoading ) && hasData;

	const chartData = useMemo( () => {
		const comparisonItems = comparisonData?.data || [];

		// Create a map of product_id to comparison data for efficient lookup
		const comparisonMap = new Map( comparisonItems.map( item => [ item.product_id, item ] ) );

		// Calculate maxValue once outside the map
		const maxCurrentValue = Math.max(
			...( data?.data?.map( p => p.product_net_revenue ?? 0 ) || [] ),
			1 // Prevent division by zero
		);

		// Calculate max previous value once outside the map
		const maxPreviousValue = Math.max(
			...comparisonItems.map( p => p.product_net_revenue ?? 0 ),
			1 // Prevent division by zero
		);

		return (
			data?.data?.map( ( product, index: number ) => {
				const currentValue = product.product_net_revenue ?? 0;

				const productImage = productImages ? productImages[ product.product_id ] : undefined;

				// Match by product_id instead of index
				const comparisonProduct = comparisonMap.get( product.product_id );
				const previousValue = comparisonProduct?.product_net_revenue ?? 0;

				const previousShare =
					comparisonItems.length > 0 && previousValue > 0
						? ( previousValue / maxPreviousValue ) * 100
						: 0;

				const label = product.product_name;
				const imageUrl = productImage?.imageUrl || '';
				const imageAlt = productImage?.imageAlt || label;
				const delta = calculateDelta( currentValue, previousValue );

				return {
					id: String( product.product_id || index ),
					label: <LeaderboardLabel label={ label } imageUrl={ imageUrl } imageAlt={ imageAlt } />,
					currentValue,
					currentShare: ( currentValue / maxCurrentValue ) * 100,
					previousValue,
					previousShare,
					delta,
				};
			} ) || []
		);
	}, [ data?.data, comparisonData?.data, productImages ] );

	const legendLabels = useMemo( () => formatLegendLabels( reportParams ), [ reportParams ] );

	const hasError = useWidgetError( isError, error, refetch );
	if ( hasError ) {
		return null;
	}

	if ( isInitialLoading ) {
		return <WidgetLoadingOverlay />;
	}

	return (
		<>
			<LeaderboardChart
				data={ chartData }
				withComparison={ hasComparison }
				legendLabels={ legendLabels }
				withOverlayLabel={ true }
				showLegend={ false }
				emptyStateIcon={ emptyStateIcon }
			/>
			{ isRefetching && <WidgetLoadingOverlay /> }
		</>
	);
}
