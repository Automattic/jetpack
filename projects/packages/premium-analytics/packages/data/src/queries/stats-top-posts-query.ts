/**
 * Internal dependencies
 */
import { statsReportQuery, type StatsReportParams } from './stats-query';

// `skip_archives=1` keeps archive pages (home, taxonomy, search, …) out of the
// post list, mirroring the Stats "Most viewed" card — archives are their own
// report (`stats/archives`).
export const statsTopPostsQuery = ( params: StatsReportParams ) =>
	statsReportQuery( 'top-posts', 'stats/top-posts', params, 'topPosts', '1.1', {
		skip_archives: 1,
	} );
