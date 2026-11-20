/**
 * Internal dependencies
 */
import { statsProxyQuery } from './stats-query';
import type { StatsQueryParams } from '../utils/stats-params';

/**
 * The `stats` keys every site-summary caller except Shares reads. One shared list keeps the
 * dashboard on one request; omitting `stat_fields` makes WPCOM compute the slow share counts too.
 */
export const STATS_SITE_SUMMARY_FIELDS =
	'views,visitors,posts,comments,views_best_day,views_best_day_total';

export const statsSiteQuery = ( params: StatsQueryParams = {} ) =>
	statsProxyQuery( {
		name: 'site',
		version: '1.1',
		endpoint: 'stats',
		params,
		sanitizer: 'site',
	} );
