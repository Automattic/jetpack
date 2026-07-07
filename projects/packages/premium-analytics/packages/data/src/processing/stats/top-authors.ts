import { safeParseFloat } from '../../utils/parsing';
import {
	coerceStatsArray,
	getStatsReportItems,
	limitStatsRows,
	mapNestedItems,
	mapStatsReportDataPoints,
	mergeStatsComparisonRows,
	normalizeStatsReportSummary,
} from './utils';
import type { StatsTopPostsItem } from './top-posts';
import type { StatsNormalizedItemBase, StatsNormalizedReport } from './types';
import type { StatsQueryParams } from '../../utils/stats-params';

export type StatsTopAuthorsItem = StatsNormalizedItemBase< StatsTopPostsItem > & {
	views: number;
	icon: string | null;
	iconClassName?: string;
	className?: string | null;
};

export type StatsTopAuthorsComparisonItem = StatsTopAuthorsItem & {
	previousViews?: number;
};

function getAuthorKey( author: StatsTopAuthorsItem ): string {
	return typeof author.label === 'string' ? author.label : '';
}

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

export function mergeStatsTopAuthorsComparisonRows(
	primaryReport?: StatsNormalizedReport< StatsTopAuthorsItem >,
	comparisonReport?: StatsNormalizedReport< StatsTopAuthorsItem >,
	maxRows?: number
) {
	return mergeStatsComparisonRows<
		StatsTopAuthorsItem,
		StatsTopAuthorsItem,
		StatsTopAuthorsComparisonItem
	>( {
		primaryRows: limitStatsRows( getStatsReportItems( primaryReport ), maxRows ),
		comparisonRows: getStatsReportItems( comparisonReport ),
		getPrimaryKey: getAuthorKey,
		getComparisonKey: getAuthorKey,
		getComparisonValue: author => author.views,
		mapRow: ( author, { previousValue } ) => ( {
			...author,
			previousViews: previousValue,
		} ),
	} );
}
