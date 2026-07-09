/**
 * External dependencies
 */
import {
	compareEmailBreakdownItems,
	useStatsEmailClicksBreakdown,
	useStatsEmailOpensBreakdown,
	type StatsEmailBreakdown,
	type StatsEmailOpensBreakdown,
} from '@jetpack-premium-analytics/data';
import { useMemo } from '@wordpress/element';
/**
 * Internal dependencies
 */
import { type EmailBreakdownMetric, type EmailBreakdownView } from './widget';

/**
 * A single normalized breakdown row, flattened from the email breakdown report
 * into the shape the leaderboard renders. Exported so Storybook can build
 * fixtures for `EmailBreakdownLeaderboard`.
 */
export type EmailBreakdownRow = {
	/**
	 * Stable identifier for the row (its index in the displayed list).
	 */
	id: number;
	/**
	 * Display label (country/device/client name, link type, or link URL).
	 */
	label: string;
	/**
	 * Metric value (opens or clicks) for the row.
	 */
	value: number;
	/**
	 * Two-letter country code, present only for the `countries` view.
	 */
	countryCode?: string;
	/**
	 * Full country name, present only for the `countries` view.
	 */
	countryFull?: string;
	/**
	 * External URL, present only for clicked user-content links (`links` view).
	 */
	link?: string;
};

/**
 * Maps the `countries`/`devices`/`clients` views onto their breakdown dimension.
 * The `links` view is intentionally excluded: it merges the `link` and
 * `user-content-link` clicks breakdowns instead and is handled separately.
 */
const VIEW_TO_BREAKDOWN: Record<
	Exclude< EmailBreakdownView, 'links' >,
	StatsEmailOpensBreakdown
> = {
	countries: 'country',
	devices: 'device',
	clients: 'client',
};

/**
 * Flatten the email breakdown report into leaderboard rows, keeping the
 * report's (already value-sorted) order.
 *
 * @param report - The normalized breakdown report, or undefined while loading.
 * @return The breakdown rows, without display ids.
 */
function toRows( report: StatsEmailBreakdown | undefined ): Omit< EmailBreakdownRow, 'id' >[] {
	const items = report?.data?.[ 0 ]?.items ?? [];

	return items.map( item => ( {
		label: String( item.label ?? '' ),
		value: item.value,
		countryCode: item.countryCode,
		countryFull: item.countryFull ? String( item.countryFull ) : undefined,
		link: item.link,
	} ) );
}

type UseEmailBreakdownRowsArgs = {
	/**
	 * The email (post) ID whose breakdown to fetch; `0`/invalid disables fetching.
	 */
	postId: number;
	/**
	 * The active breakdown view.
	 */
	view: EmailBreakdownView;
	/**
	 * Whether the dimension views read the opens or the clicks breakdown. The
	 * `links` view ignores this and always reads clicks (only clicked links exist).
	 */
	metric: EmailBreakdownMetric;
	/**
	 * Maximum rows to return; `0` keeps all rows.
	 */
	max: number;
};

type EmailBreakdownRowsState = {
	rows: EmailBreakdownRow[];
	isLoading: boolean;
	isFetching: boolean;
	isError: boolean;
	refetch: () => void;
};

/**
 * Fetch and normalize the email breakdown rows for the active view via the
 * shared Stats data layer.
 *
 * The `countries`/`devices`/`clients` views read the opens or clicks breakdown
 * per `metric`, matching the Calypso email detail page where the modules follow
 * the active Opens/Clicks tab. The `links` view mirrors Calypso's links module:
 * it fetches both the `link` breakdown (internal link types — Post URL, Like,
 * Comment, Unsubscribe, aggregated Other) and the `user-content-link` breakdown
 * (clicked user-content URLs) and merges them into one value-sorted list.
 *
 * All hooks always run (rules of hooks) but only the queries the active view and
 * metric need are enabled; `country` is an inert placeholder dimension for the
 * links view's disabled dimension queries.
 *
 * @param {UseEmailBreakdownRowsArgs} args - Hook arguments.
 * @return The current rows/loading/error state.
 */
export default function useEmailBreakdownRows( {
	postId,
	view,
	metric,
	max,
}: UseEmailBreakdownRowsArgs ): EmailBreakdownRowsState {
	const isLinksView = view === 'links';
	const dimension = isLinksView ? 'country' : VIEW_TO_BREAKDOWN[ view ];

	const opens = useStatsEmailOpensBreakdown( postId, dimension, {
		enabled: ! isLinksView && metric === 'opens',
	} );
	const clicks = useStatsEmailClicksBreakdown( postId, dimension, {
		enabled: ! isLinksView && metric === 'clicks',
	} );
	const internalLinks = useStatsEmailClicksBreakdown( postId, 'link', {
		enabled: isLinksView,
	} );
	const userContentLinks = useStatsEmailClicksBreakdown( postId, 'user-content-link', {
		enabled: isLinksView,
	} );

	const dimensionQuery = metric === 'clicks' ? clicks : opens;
	const activeQueries = isLinksView ? [ internalLinks, userContentLinks ] : [ dimensionQuery ];

	const internalLinksReport = internalLinks.data as StatsEmailBreakdown | undefined;
	const userContentLinksReport = userContentLinks.data as StatsEmailBreakdown | undefined;
	const dimensionReport = dimensionQuery.data as StatsEmailBreakdown | undefined;

	const rows = useMemo( () => {
		const merged = isLinksView
			? // Keep internal-type rows (no URL) from `link` and URL rows from
			  // `user-content-link`, so a row can never be double-counted if an
			  // endpoint ever answers with both payloads. Re-sorting with the data
			  // layer's comparator restores the single-report order across the merge.
			  [
					...toRows( internalLinksReport ).filter( row => ! row.link ),
					...toRows( userContentLinksReport ).filter( row => Boolean( row.link ) ),
			  ].sort( compareEmailBreakdownItems )
			: toRows( dimensionReport );

		// `max = 0` means "all rows" (the Stats-widget convention), so only slice
		// when a positive `max` is requested.
		return merged
			.slice( 0, max > 0 ? max : undefined )
			.map( ( row, index ) => ( { ...row, id: index } ) );
	}, [ isLinksView, internalLinksReport, userContentLinksReport, dimensionReport, max ] );

	return {
		rows,
		isLoading: activeQueries.some( query => query.isLoading ),
		isFetching: activeQueries.some( query => query.isFetching ),
		// A query that failed before ever returning data leaves its part of the
		// view missing (for the links view, one of the two merged breakdowns), so
		// surface the error even when another query produced rows. Once a query
		// has data, a transient refetch failure keeps showing the populated rows
		// instead of replacing them with the error state.
		isError: activeQueries.some( query => query.isError && query.data === undefined ),
		refetch: () => activeQueries.forEach( query => query.refetch() ),
	};
}
