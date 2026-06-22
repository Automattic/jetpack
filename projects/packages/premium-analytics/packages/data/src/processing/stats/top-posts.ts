import { safeParseFloat } from '../../utils/parsing';
import {
	getStatsArray,
	mapNestedItems,
	mapStatsReportDataPoints,
	normalizeStatsReportSummary,
} from './foundation';
import type {
	StatsNormalizedDataPoint,
	StatsNormalizedReport,
	StatsRecord,
	StatsTopPostsItem,
} from './types';
import type { StatsQueryParams } from '../../utils/stats-params';

function getStatsTopPostLink( item: StatsRecord ): string | null {
	if ( typeof item.href === 'string' ) {
		return item.href;
	}

	if ( typeof item.link === 'string' ) {
		return item.link;
	}

	return null;
}

function normalizeStatsTopPostItem( item: StatsRecord ): StatsTopPostsItem {
	const link = getStatsTopPostLink( item );

	return {
		id: item.id as string | number | undefined,
		label: item.title,
		views: safeParseFloat( item.views ),
		link,
		page: item.id ? `/stats/post/${ item.id }` : null,
		public: item.public,
		type: item.type,
		date: item.date,
		status: item.status,
		video_play: item.video_play,
		actions: link ? [ { type: 'link', data: link } ] : [],
		children: mapNestedItems( getStatsArray( item.children ), normalizeStatsTopPostItem ),
	};
}

function normalizeStatsTopPostsData(
	response: unknown,
	query?: StatsQueryParams
): Array< StatsNormalizedDataPoint< StatsTopPostsItem > > {
	return mapStatsReportDataPoints( response, query, [ 'postviews' ], normalizeStatsTopPostItem );
}

export function sanitizeStatsTopPostsResponse(
	response: unknown,
	query?: StatsQueryParams
): StatsNormalizedReport< StatsTopPostsItem > {
	return {
		summary: normalizeStatsReportSummary( response, query, [ 'postviews' ] ),
		data: normalizeStatsTopPostsData( response, query ),
	};
}
