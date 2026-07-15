import { safeParseFloat } from '../../utils/parsing';
import { coerceStatsArray, coerceStatsRecord } from './utils';
import type { StatsRecord } from './types';

export type StatsVideoPlaysSummaryItem = {
	id?: string | number;
	title: string;
	views: number;
	impressions: number;
	watch_time: number;
	retention_rate: number;
	link: string | null;
};

export type StatsVideoPlaysSummaryTotal = {
	views: number;
	impressions: number;
	watch_time: number;
};

export type StatsVideoPlaysSummary = {
	data: StatsVideoPlaysSummaryItem[];
	total: StatsVideoPlaysSummaryTotal;
};

export function sanitizeStatsVideoPlaysSummaryResponse(
	response: unknown
): StatsVideoPlaysSummary {
	const payload = coerceStatsRecord( response );
	const summary = coerceStatsRecord( coerceStatsRecord( payload.days ).summary );
	const total = coerceStatsRecord( summary.total );
	const data = coerceStatsArray< StatsRecord >( summary.data ).map( item => ( {
		id: item.post_id as string | number | undefined,
		title: typeof item.title === 'string' ? item.title : '',
		views: safeParseFloat( item.views ),
		impressions: safeParseFloat( item.impressions ),
		watch_time: safeParseFloat( item.watch_time ),
		retention_rate: safeParseFloat( item.retention_rate ),
		link: typeof item.url === 'string' ? item.url : null,
	} ) );

	return {
		data,
		total: {
			views: safeParseFloat( total.views ),
			impressions: safeParseFloat( total.impressions ),
			watch_time: safeParseFloat( total.watch_time ),
		},
	};
}
