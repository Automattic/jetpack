/**
 * External dependencies
 */
import {
	useReportProducts,
	useProductImages,
	type FilterCondition,
} from '@jetpack-premium-analytics/data';
import { Icon } from '@jetpack-premium-analytics/externals';
import { productBlouse } from '@jetpack-premium-analytics/icons';
import { __ } from '@wordpress/i18n';
import { useMemo } from 'react';
import { buildLeaderboardRow, LeaderboardChart } from '../../components/chart-leaderboard';
import { useWidgetRootContext } from '../../components/widget-root';
import { WidgetState } from '../../components/widget-state';
/**
 * Internal dependencies
 */
import {
	calculateDelta,
	formatLegendLabels,
	getCombinedPeriodMax,
	sharePercentage,
} from '../../helpers';

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

	/**
	 * Text to display in the empty state.
	 * Defaults to a "no product sales" message.
	 */
	emptyStateText?: string;

	/**
	 * Text to display in the error state.
	 * Defaults to a "couldn't load product data" message.
	 */
	errorText?: string;
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
 * @param props.emptyStateText - Text to display in empty state
 * @param props.errorText      - Text to display in error state
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
	emptyStateText,
	errorText,
}: TopPerformingProductLeaderboardWidgetProps ) {
	const { reportParams } = useWidgetRootContext();

	const params = useMemo(
		() => ( {
			...reportParams,
			...( filter && { filters: [ filter ] } ),
		} ),
		[ reportParams, filter ]
	);

	const { primary, comparison, hasComparison, isLoading, isFetching, hasData, isError, refetch } =
		useReportProducts( params, limit );

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

	const chartData = useMemo( () => {
		const primaryItems = data?.data || [];
		const comparisonItems = comparisonData?.data || [];

		// Create a map of product_id to comparison data for efficient lookup
		const comparisonMap = new Map( comparisonItems.map( item => [ item.product_id, item ] ) );

		const maxValue = getCombinedPeriodMax(
			primaryItems.map( product => product.product_net_revenue ?? 0 ),
			hasComparison
				? primaryItems.map(
						product => comparisonMap.get( product.product_id )?.product_net_revenue
				  )
				: []
		);

		return primaryItems.map( ( product, index: number ) => {
			const currentValue = product.product_net_revenue ?? 0;

			const productImage = productImages ? productImages[ product.product_id ] : undefined;

			// Match by product_id instead of index.
			const comparisonProduct = comparisonMap.get( product.product_id );

			// A product ranked below the previous top-N cutoff is absent from
			// the comparison list. That is an unknown previous value, not a
			// real 0, so leave the comparison fields undefined and let the
			// chart show a missing-data placeholder instead of implying the
			// product earned nothing. A product present with 0 revenue keeps
			// its known comparison value while its unavailable delta renders
			// separately.
			const previousValue = comparisonProduct?.product_net_revenue;
			const hasComparisonValue = previousValue !== undefined;

			const label = product.product_name;
			const imageUrl = productImage?.imageUrl || '';
			const imageAlt = productImage?.imageAlt || label;

			return {
				id: String( product.product_id || index ),
				...buildLeaderboardRow( {
					label,
					media: { kind: 'thumbnail', url: imageUrl, alt: imageAlt },
					action: { kind: 'static' },
				} ),
				currentValue,
				// Net revenue can be negative once refunds outweigh sales; a
				// negative share would render an invalid bar width, so clamp
				// both periods' shares to zero-width bars.
				currentShare: sharePercentage( Math.max( currentValue, 0 ), maxValue ),
				previousValue,
				previousShare: hasComparisonValue
					? sharePercentage( Math.max( previousValue, 0 ), maxValue )
					: undefined,
				delta: hasComparisonValue ? calculateDelta( currentValue, previousValue ) : undefined,
			};
		} );
	}, [ data?.data, comparisonData?.data, hasComparison, productImages ] );

	// `hasComparison` only tracks the date range. When none of the visible
	// products carry over from the comparison period, comparison mode would draw
	// a column of placeholders, so suppress it rather than show an empty column.
	const hasVisibleComparison = useMemo(
		() => chartData.some( row => row.previousValue !== undefined ),
		[ chartData ]
	);

	const legendLabels = useMemo( () => formatLegendLabels( reportParams ), [ reportParams ] );

	return (
		<WidgetState
			isLoading={ ( isLoading || imagesLoading ) && ! hasData }
			isFetching={ isFetching || imagesLoading }
			// The report queries keep the previous period's data as placeholders
			// across range changes, so only surface the error when there is
			// nothing to show.
			isError={ isError && ! hasData }
			isEmpty={ chartData.length === 0 }
			error={ {
				description:
					errorText ??
					__(
						"We couldn't load product data. Please try again in a moment.",
						'jetpack-premium-analytics-pkg'
					),
				actions: [ { label: __( 'Retry', 'jetpack-premium-analytics-pkg' ), onClick: refetch } ],
			} }
			empty={ {
				icon: emptyStateIcon,
				description:
					emptyStateText ??
					__( 'No product sales in this period.', 'jetpack-premium-analytics-pkg' ),
			} }
		>
			<LeaderboardChart
				data={ chartData }
				withComparison={ hasComparison && hasVisibleComparison }
				legendLabels={ legendLabels }
				withOverlayLabel={ true }
				showLegend={ false }
			/>
		</WidgetState>
	);
}
