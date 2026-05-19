import apiFetch from '@wordpress/api-fetch';
import { useEffect, useState } from '@wordpress/element';
import { addQueryArgs } from '@wordpress/url';
import { resolveSelectionRange } from './range';
import type {
	PodcastShowStats,
	PodcastStatsOverviewResponse,
	PodcastStatsPeriod,
	PodcastStatsSelection,
	PodcastStatsSummaryResponse,
} from './types';

const DEFAULT_TOP_LIMIT = 10;

/**
 * Pick the period total from the overview response.
 *
 * @param overview - Overview response.
 * @param period   - Selected period.
 * @return         Total plays, or null when no preset matches.
 */
function getOverviewTotal(
	overview: PodcastStatsOverviewResponse,
	period: PodcastStatsPeriod
): number | null {
	switch ( period ) {
		case '7d':
			return overview.totals.last_7_days.plays;
		case '30d':
			return overview.totals.last_30_days.plays;
		case '90d':
			return overview.totals.last_90_days.plays;
		case 'all':
			return overview.totals.all_time.plays;
		default:
			return null;
	}
}

/**
 * Show-level stats. Overview is period-independent (fetched once); summary refetches per selection.
 *
 * @param selection - Stats selection.
 * @param limit     - Max breakdown rows.
 * @return          Query result.
 */
export function useShowStatsQuery(
	selection: PodcastStatsSelection,
	limit: number = DEFAULT_TOP_LIMIT
): { data?: PodcastShowStats; isLoading: boolean; isError: boolean } {
	const [ overview, setOverview ] = useState< PodcastStatsOverviewResponse | undefined >();
	const [ summary, setSummary ] = useState< PodcastStatsSummaryResponse | undefined >();
	const [ overviewError, setOverviewError ] = useState( false );
	const [ summaryError, setSummaryError ] = useState( false );

	const { period } = selection;
	const range = resolveSelectionRange( selection );
	const { from, to } = range;

	useEffect( () => {
		let cancelled = false;
		setOverviewError( false );
		apiFetch< PodcastStatsOverviewResponse >( {
			path: addQueryArgs( '/wpcom/v2/podcast-stats/overview', { limit } ),
			method: 'GET',
		} )
			.then( response => {
				if ( ! cancelled ) {
					setOverview( response );
				}
			} )
			.catch( () => {
				if ( ! cancelled ) {
					setOverviewError( true );
				}
			} );
		return () => {
			cancelled = true;
		};
	}, [ limit ] );

	useEffect( () => {
		let cancelled = false;
		setSummaryError( false );
		apiFetch< PodcastStatsSummaryResponse >( {
			path: addQueryArgs( '/wpcom/v2/podcast-stats', { from, to, limit } ),
			method: 'GET',
		} )
			.then( response => {
				if ( ! cancelled ) {
					setSummary( response );
				}
			} )
			.catch( () => {
				if ( ! cancelled ) {
					setSummaryError( true );
				}
			} );
		return () => {
			cancelled = true;
		};
	}, [ from, to, limit ] );

	const isError = overviewError || summaryError;

	// Wait for both queries — keeps prior data on screen across period changes.
	let data: PodcastShowStats | undefined;
	if ( summary && overview ) {
		const presetTotal = getOverviewTotal( overview, period );
		data = {
			...summary,
			period,
			total_plays: presetTotal ?? summary.total_plays,
			top_day: overview.top_day,
			all_time_plays: overview.totals.all_time.plays,
		};
		// 'all' breakdowns come from overview: summary range is capped at 1 year.
		if ( period === 'all' ) {
			data.by_app = overview.by_app;
			data.by_country = overview.by_country;
			data.top_episodes = overview.top_episodes;
		}
	}

	return {
		data,
		isLoading: ! data && ! isError,
		isError,
	};
}
