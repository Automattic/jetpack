import { safeParseFloat } from '../../utils/parsing';
import {
	getStatsArray,
	mapNestedItems,
	mapStatsReportDataPoints,
	normalizeStatsReportSummary,
} from './foundation';
import type { StatsNormalizedReport, StatsTopAuthorsItem } from './types';
import type { StatsQueryParams } from '../../utils/stats-params';

export function sanitizeStatsTopAuthorsResponse(
	response: unknown,
	query?: StatsQueryParams
): StatsNormalizedReport< StatsTopAuthorsItem > {
	return {
		summary: normalizeStatsReportSummary( response, query, [ 'authors' ] ),
		data: mapStatsReportDataPoints( response, query, [ 'authors' ], item => ( {
			label: item.name || 'Untracked Authors',
			views: safeParseFloat( item.views ),
			icon: typeof item.avatar === 'string' ? item.avatar : null,
			iconClassName: 'avatar-user',
			className: 'module-content-list-item-large',
			children: mapNestedItems( getStatsArray( item.posts ), post => ( {
				id: post.id as string | number | undefined,
				label: post.title,
				views: safeParseFloat( post.views ),
				link: typeof post.url === 'string' ? post.url : null,
				page: post.id ? `/stats/post/${ post.id }` : null,
				children: null,
			} ) ),
		} ) ),
	};
}
