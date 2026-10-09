/**
 * External dependencies
 */
import {
	Leaderboard,
	describeError,
	useWidgetRootContext,
	type DataFormat,
	type LeaderboardRowInput,
} from '@automattic/jetpack-premium-analytics-sdk';
import { useMemo, type ComponentProps } from 'react';
/**
 * Internal dependencies
 */
import { useReportProducts, type FilterCondition } from '../reports';

/** How many products the report asks for, and how many rows the leaderboard shows. */
const TOP_PRODUCTS_LIMIT = 5;

const CURRENCY_FORMAT: DataFormat = { type: 'currency', options: { useMultipliers: true } };

type ProductLeaderboardProps = {
	/** The product types the leaderboard ranks. */
	filter: FilterCondition;
	/** The icon of the empty state. */
	emptyIcon: ComponentProps< typeof Leaderboard >[ 'empty' ][ 'icon' ];
	emptyText: string;
	errorText: string;
};

/**
 * The top products of the period by net revenue, with their images, read under the widget root
 * for its report params.
 *
 * @param {ProductLeaderboardProps} props - The component props.
 * @return {JSX.Element} The leaderboard, or the loading, error or empty state of its report.
 */
export function ProductLeaderboard( {
	filter,
	emptyIcon,
	emptyText,
	errorText,
}: ProductLeaderboardProps ) {
	const { reportParams } = useWidgetRootContext();
	const params = useMemo(
		() => ( { ...reportParams, filters: [ filter ] } ),
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
	} = useReportProducts( params, TOP_PRODUCTS_LIMIT );

	const rows = useMemo< LeaderboardRowInput[] >( () => {
		const previous = new Map(
			( comparison.data?.data ?? [] ).map( item => [ item.product_id, item.product_net_revenue ] )
		);
		const images = primary.data?.images ?? {};

		return ( primary.data?.data ?? [] ).map( ( product, index ) => ( {
			id: String( product.product_id || index ),
			label: product.product_name,
			value: product.product_net_revenue,
			// A product below the previous top-N cutoff has no comparison value, not a 0.
			previousValue: previous.get( product.product_id ),
			media: {
				kind: 'thumbnail',
				url: images[ product.product_id ]?.url || undefined,
				alt: images[ product.product_id ]?.alt || product.product_name,
			},
		} ) );
	}, [ primary.data, comparison.data ] );

	// The range may compare while no shown product carries over: no column then.
	const hasVisibleComparison = hasComparison && rows.some( row => row.previousValue !== undefined );

	return (
		<Leaderboard
			rows={ rows }
			status={ {
				isLoading,
				isFetching,
				// The queries keep the previous range's data on screen, so an error only shows without it.
				isError: isError && ! hasData,
				hasComparison: hasVisibleComparison,
				refetch,
			} }
			error={ describeError( error, { retryDescription: errorText, onRetry: refetch } ) }
			empty={ { icon: emptyIcon, description: emptyText } }
			maxRows={ TOP_PRODUCTS_LIMIT }
			format={ CURRENCY_FORMAT }
		/>
	);
}
