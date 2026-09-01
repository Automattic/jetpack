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
import {
	buildLeaderboardRow,
	LeaderboardChart,
	LeaderboardSkeleton,
} from '../../components/chart-leaderboard';
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
 * Leaderboard of top-performing products by net revenue, with images and
 * period-over-period comparison. Shared by every product-based leaderboard
 * (regular products, bookings, …) through the `filter` prop.
 *
 * Must render within a WidgetRoot, which provides reportParams via context.
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

	const productIds = useMemo(
		() => data?.data?.map( item => item.product_id ) || [],
		[ data?.data ]
	);

	const { data: productImages, isLoading: imagesLoading } = useProductImages( {
		productIds,
	} );

	const chartData = useMemo( () => {
		const primaryItems = data?.data || [];
		const comparisonItems = comparisonData?.data || [];

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

			// A product below the previous top-N cutoff is absent from the comparison list —
			// an unknown previous value, not a real 0 — so leave it undefined for the missing-data
			// placeholder. A product present with 0 revenue keeps its known comparison value.
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
				// Net revenue can go negative once refunds outweigh sales; clamp both periods'
				// shares to zero-width bars rather than render an invalid negative width.
				currentShare: sharePercentage( Math.max( currentValue, 0 ), maxValue ),
				previousValue,
				previousShare: hasComparisonValue
					? sharePercentage( Math.max( previousValue, 0 ), maxValue )
					: undefined,
				delta: hasComparisonValue ? calculateDelta( currentValue, previousValue ) : undefined,
			};
		} );
	}, [ data?.data, comparisonData?.data, hasComparison, productImages ] );

	// `hasComparison` only tracks the date range; when no visible product carries
	// over from that period, suppress comparison mode rather than draw an empty column.
	const hasVisibleComparison = useMemo(
		() => chartData.some( row => row.previousValue !== undefined ),
		[ chartData ]
	);

	const legendLabels = useMemo( () => formatLegendLabels( reportParams ), [ reportParams ] );

	return (
		<WidgetState
			// Images only start fetching once the report supplies product IDs, so rows
			// land first and thumbnails fill in behind — that gap belongs in `isFetching`, not loading.
			isLoading={ isLoading }
			isFetching={ isFetching || imagesLoading }
			// The report queries keep the previous period's data as placeholders across
			// range changes, so only surface the error when nothing else is showing.
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
			renderLoading={ <LeaderboardSkeleton rows={ limit } /> }
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
