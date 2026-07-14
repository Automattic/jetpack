/**
 * Internal dependencies
 */
import { statsReportQuery, type StatsReportParams } from './stats-query';

// `skip_archives=1` mirrors the Stats "Most viewed" card, which sends the same
// query to both reports: the API then returns the homepage-as-latest-posts
// entry inside `stats/top-posts` (as "Homepage (Latest posts)") and drops it
// from this report.
export const statsArchivesQuery = ( params: StatsReportParams ) =>
	statsReportQuery( 'archives', 'stats/archives', params, 'archives', '1.1', {
		skip_archives: 1,
	} );
