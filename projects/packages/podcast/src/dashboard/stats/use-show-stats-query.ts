import { getSiteData } from '@automattic/jetpack-script-data';
import apiFetch from '@wordpress/api-fetch';
import { useEffect, useState } from '@wordpress/element';
import { addQueryArgs } from '@wordpress/url';
import { getStatsDateRange } from './range';
import type {
	PodcastShowStats,
	PodcastStatsOverviewResponse,
	PodcastStatsPeriod,
	PodcastStatsSummaryResponse,
} from './types';

const DEFAULT_TOP_LIMIT = 10;

/**
 * Pick the period-appropriate total from the overview response.
 *
 * @param overview - Overview response.
 * @param period   - Currently selected period.
 * @return         Total plays for the period.
 */
function getOverviewTotal(
	overview: PodcastStatsOverviewResponse,
	period: PodcastStatsPeriod
): number {
	if ( period === '7d' ) {
		return overview.totals.last_7_days.plays;
	}
	if ( period === '30d' ) {
		return overview.totals.last_30_days.plays;
	}
	if ( period === '90d' ) {
		return overview.totals.last_90_days.plays;
	}
	return overview.totals.all_time.plays;
}

/**
 * Show-level stats. Two parallel requests: the overview is period-independent
 * (fetched once per blog), the summary refetches when the user changes period.
 *
 * @param period - Stats period.
 * @param limit  - Max rows for nested breakdowns.
 * @return       Combined show stats with loading and error state.
 */
export function useShowStatsQuery(
	period: PodcastStatsPeriod = '30d',
	limit: number = DEFAULT_TOP_LIMIT
): { data?: PodcastShowStats; isLoading: boolean; isError: boolean } {
	const [ overview, setOverview ] = useState< PodcastStatsOverviewResponse | undefined >();
	const [ summary, setSummary ] = useState< PodcastStatsSummaryResponse | undefined >();
	const [ overviewError, setOverviewError ] = useState( false );
	const [ summaryError, setSummaryError ] = useState( false );

	useEffect( () => {
		const blogId = Number( getSiteData()?.wpcom?.blog_id ?? 0 );
		if ( ! blogId ) {
			return;
		}
		let cancelled = false;
		setOverviewError( false );
		apiFetch< PodcastStatsOverviewResponse >( {
			path: addQueryArgs( `/wpcom/v2/sites/${ blogId }/podcast-stats/overview`, { limit } ),
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
		const blogId = Number( getSiteData()?.wpcom?.blog_id ?? 0 );
		if ( ! blogId ) {
			return;
		}
		const range = getStatsDateRange( period );
		let cancelled = false;
		setSummaryError( false );
		apiFetch< PodcastStatsSummaryResponse >( {
			path: addQueryArgs( `/wpcom/v2/sites/${ blogId }/podcast-stats`, {
				from: range.from,
				to: range.to,
				limit,
			} ),
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
	}, [ period, limit ] );

	const isError = overviewError || summaryError;

	// Build data only once both queries have landed, so the UI never shows a
	// transient state where total_plays is the summary's value and top_day is
	// null. After first load, period changes keep the previous summary on
	// screen until the new one arrives — no skeleton flash.
	let data: PodcastShowStats | undefined;
	if ( summary && overview ) {
		data = {
			...summary,
			period,
			total_plays: getOverviewTotal( overview, period ),
			top_day: overview.top_day,
		};
		// 'all' breakdowns must come from the overview: the summary's range is
		// capped at 1 year for chart rendering, so it would otherwise drop
		// episodes/apps/countries with downloads older than a year.
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
