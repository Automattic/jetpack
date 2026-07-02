import { safeParseFloat } from '../../utils/parsing';
import {
	coerceStatsArray,
	mapNestedItems,
	mapStatsReportDataPoints,
	normalizeStatsReportSummary,
} from './utils';
import type {
	StatsItemAction,
	StatsNormalizedItemBase,
	StatsNormalizedDataPoint,
	StatsNormalizedReport,
	StatsRecord,
} from './types';
import type { StatsQueryParams } from '../../utils/stats-params';

export interface StatsTopPostsItem extends StatsNormalizedItemBase< StatsTopPostsItem > {
	id?: string | number;
	views: number;
	link: string | null;
	page?: string | null;
	public?: unknown;
	type?: unknown;
	date?: unknown;
	status?: unknown;
	video_play?: unknown;
	actions?: StatsItemAction[];
}

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
		children: mapNestedItems( coerceStatsArray( item.children ), normalizeStatsTopPostItem ),
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
