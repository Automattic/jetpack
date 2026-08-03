/**
 * Internal dependencies
 */
import { statsReportQuery, type StatsReportParams } from './stats-query';

// `skip_archives=1` keeps archive pages (home, taxonomy, search, …) out of the
// post list, mirroring the Stats "Most viewed" card — archives are their own
// report (`stats/archives`).
export const statsTopPostsQuery = ( params: StatsReportParams ) =>
	statsReportQuery(
		'top-posts',
		'stats/top-posts',
		params,
		'topPosts',
		'1.1',
		{
			skip_archives: 1,
		},
		// This endpoint still resolves its date params in UTC rather than the
		// site's timezone, and reads `start_date` without normalizing it at all.
		// A site behind UTC asking for the day ending 23:59:59.999 local
		// therefore resolves the *next* calendar day, dropping the day it asked
		// for out of the ranking. Send bare days until WOOA7S-1843 lands.
		{ bareDateParams: true }
	);
