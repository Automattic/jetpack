import { safeParseFloat } from '../../utils/parsing';
import { coerceStatsArray, coerceStatsRecord, createStatsListDataPoint } from './utils';
import type {
	StatsItemAction,
	StatsNormalizedItemBase,
	StatsNormalizedReport,
	StatsRecord,
} from './types';
import type { StatsQueryParams } from '../../utils/stats-params';

export interface StatsEmailSummaryItem extends StatsNormalizedItemBase< null > {
	id?: string | number;
	value: number;
	link?: unknown;
	actions?: StatsItemAction[];
	date?: unknown;
	type?: unknown;
	opens: number;
	clicks: number;
	opens_rate: number;
	clicks_rate: number;
	unique_opens: number;
	unique_clicks: number;
	total_sends: number;
}

function normalizeStatsEmailSummaryItem( post: StatsRecord ): StatsEmailSummaryItem {
	const link = post.href;

	return {
		id: post.id as string | number | undefined,
		label: post.title,
		// Opens is the headline metric for the emails leaderboard; clicks_rate is frequently 0.
		value: safeParseFloat( post.opens ),
		link,
		actions: typeof link === 'string' ? [ { type: 'link', data: link } ] : [],
		date: post.date,
		type: post.type,
		opens: safeParseFloat( post.opens ),
		clicks: safeParseFloat( post.clicks ),
		opens_rate: safeParseFloat( post.opens_rate ),
		clicks_rate: safeParseFloat( post.clicks_rate ),
		unique_opens: safeParseFloat( post.unique_opens ),
		unique_clicks: safeParseFloat( post.unique_clicks ),
		total_sends: safeParseFloat( post.total_sends ),
		children: null,
	};
}

export function sanitizeStatsEmailSummaryResponse(
	response: unknown,
	query?: StatsQueryParams
): StatsNormalizedReport< StatsEmailSummaryItem > {
	const items = coerceStatsArray< StatsRecord >( coerceStatsRecord( response ).posts ).map(
		normalizeStatsEmailSummaryItem
	);

	return {
		summary: {
			total_sends: items.reduce( ( total, item ) => total + item.total_sends, 0 ),
			opens: items.reduce( ( total, item ) => total + item.opens, 0 ),
			clicks: items.reduce( ( total, item ) => total + item.clicks, 0 ),
			unique_opens: items.reduce( ( total, item ) => total + item.unique_opens, 0 ),
			unique_clicks: items.reduce( ( total, item ) => total + item.unique_clicks, 0 ),
		},
		data: items.length ? [ createStatsListDataPoint( response, query, items ) ] : [],
	};
}
