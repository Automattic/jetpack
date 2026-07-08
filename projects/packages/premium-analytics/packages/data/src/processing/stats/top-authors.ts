import { safeParseFloat } from '../../utils/parsing';
import {
	coerceStatsArray,
	mapNestedItems,
	mapStatsReportDataPoints,
	normalizeStatsReportSummary,
} from './utils';
import type { StatsTopPostsItem } from './top-posts';
import type { StatsNormalizedItemBase, StatsNormalizedReport } from './types';
import type { StatsQueryParams } from '../../utils/stats-params';

export type StatsTopAuthorsItem = StatsNormalizedItemBase< StatsTopPostsItem > & {
	id?: string | number;
	views: number;
	icon: string | null;
	iconClassName?: string;
	className?: string | null;
};

function getAuthorId( item: Record< string, unknown > ): string | number | undefined {
	const id = item.author_id ?? item.authorId;

	return typeof id === 'string' || typeof id === 'number' ? id : undefined;
}

export function sanitizeStatsTopAuthorsResponse(
	response: unknown,
	query?: StatsQueryParams
): StatsNormalizedReport< StatsTopAuthorsItem > {
	return {
		summary: normalizeStatsReportSummary( response, query, [ 'authors' ] ),
		data: mapStatsReportDataPoints( response, query, [ 'authors' ], item => ( {
			id: getAuthorId( item ),
			label: item.name || 'Untracked Authors',
			views: safeParseFloat( item.views ),
			icon: typeof item.avatar === 'string' ? item.avatar : null,
			iconClassName: 'avatar-user',
			className: 'module-content-list-item-large',
			children: mapNestedItems( coerceStatsArray( item.posts ), post => ( {
				id: post.id as string | number | undefined,
				label: post.title,
				views: safeParseFloat( post.views ),
				link: typeof post.url === 'string' ? post.url : null,
				page: post.id ? `/stats/post/${ post.id }` : null,
				actions: typeof post.url === 'string' ? [ { type: 'link', data: post.url } ] : [],
				children: null,
			} ) ),
		} ) ),
	};
}
