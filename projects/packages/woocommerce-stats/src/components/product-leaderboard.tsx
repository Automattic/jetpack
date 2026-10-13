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
import { useMemo } from 'react';
/**
 * Internal dependencies
 */
import { useProductImages, useReportProducts, type FilterCondition } from '../reports';

/** How many products the report asks for, and how many rows the leaderboard shows. */
const TOP_PRODUCTS_LIMIT = 5;

const CURRENCY_FORMAT: DataFormat = { type: 'currency', options: { useMultipliers: true } };

type ProductLeaderboardProps = {
	/** The product types the leaderboard ranks. */
	filter: FilterCondition;
	errorText: string;
	/** What the chart shows, such as the widget title; the chart is named "<title> chart". */
	chartTitle: string;
};

/**
 * The top products of the period by net revenue, with their images, read under the widget root
 * for its report params.
 *
 * @param {ProductLeaderboardProps} props - The component props.
 * @return {JSX.Element} The leaderboard, or the loading, error or empty state of its report.
 */
export function ProductLeaderboard( { filter, errorText, chartTitle }: ProductLeaderboardProps ) {
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
	// The thumbnails follow the rows: the report paints as it answers, the images fill in behind.
	const productIds = useMemo(
		() => ( primary.data?.data ?? [] ).map( item => item.product_id ),
		[ primary.data ]
	);
	const images = useProductImages( productIds, params );

	const rows = useMemo< LeaderboardRowInput[] >( () => {
		const previous = new Map(
			( comparison.data?.data ?? [] ).map( item => [ item.product_id, item.product_net_revenue ] )
		);
		const imageById = images.primary.data ?? {};

		return ( primary.data?.data ?? [] ).map( ( product, index ) => ( {
			id: String( product.product_id || index ),
			label: product.product_name,
			value: product.product_net_revenue,
			// A product below the previous top-N cutoff has no comparison value, not a 0.
			previousValue: previous.get( product.product_id ),
			media: {
				kind: 'thumbnail',
				url: imageById[ product.product_id ]?.url || undefined,
				alt: imageById[ product.product_id ]?.alt || product.product_name,
			},
		} ) );
	}, [ primary.data, comparison.data, images.primary.data ] );

	// The range may compare while no shown product carries over: no column then.
	const hasVisibleComparison = hasComparison && rows.some( row => row.previousValue !== undefined );

	return (
		<Leaderboard
			chartTitle={ chartTitle }
			rows={ rows }
			status={ {
				isLoading,
				isFetching: isFetching || images.isFetching,
				// The queries keep the previous range's data on screen, so an error only shows without it.
				isError: isError && ! hasData,
				hasComparison: hasVisibleComparison,
				refetch,
			} }
			error={ describeError( error, { retryDescription: errorText, onRetry: refetch } ) }
			maxRows={ TOP_PRODUCTS_LIMIT }
			format={ CURRENCY_FORMAT }
		/>
	);
}
