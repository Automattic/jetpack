import { safeParseFloat } from '../../utils/parsing';
import {
	createStatsSummaryDataPoint,
	getStatsArrayFromKeys,
	coerceStatsRecord,
	getStatsSummaryIntervalFields,
	getStatsTopLevelDataDate,
	mapStatsReportDataPoints,
	normalizeStatsSummary,
} from './utils';
import type {
	StatsItemAction,
	StatsNormalizedDataPoint,
	StatsNormalizedItemBase,
	StatsNormalizedReport,
	StatsRecord,
} from './types';
import type { StatsQueryParams } from '../../utils/stats-params';

export type StatsVideoPlaysItem = StatsNormalizedItemBase & {
	id?: string | number;
	plays: number;
	impressions: number;
	watch_time: number;
	retention_rate: number;
	link: string | null;
	actions?: StatsItemAction[];
	children: null;
};

export function sanitizeStatsVideoPlaysResponse(
	response: unknown,
	query?: StatsQueryParams
): StatsNormalizedReport< StatsVideoPlaysItem > {
	const payload = coerceStatsRecord( response );
	// Complete stats expose richer rows under `data`; default video stats use `plays`.
	const videoDataKeys = query?.complete_stats ? [ 'data', 'plays' ] : [ 'plays', 'data' ];
	const parse = ( item: StatsRecord ): StatsVideoPlaysItem => ( {
		id: item.post_id as string | number | undefined,
		label: item.title,
		// Complete-stats summary rows use `views` for the play count.
		plays: safeParseFloat( item.views ?? item.plays ),
		impressions: safeParseFloat( item.impressions ),
		watch_time: safeParseFloat( item.watch_time ),
		retention_rate: safeParseFloat( item.retention_rate ),
		link: typeof item.url === 'string' ? item.url : null,
		actions: typeof item.url === 'string' ? [ { type: 'link', data: item.url } ] : [],
		children: null,
	} );
	const getSummarySource = () => {
		const summary = coerceStatsRecord( payload.summary );

		return Object.keys( summary ).length
			? summary
			: coerceStatsRecord( coerceStatsRecord( payload.days ).summary );
	};
	const summarySource = query?.summarize ? getSummarySource() : undefined;
	const mapSummaryData = (): Array< StatsNormalizedDataPoint< StatsVideoPlaysItem > > => {
		if ( ! summarySource ) {
			return [];
		}

		const { found, items } = getStatsArrayFromKeys< StatsRecord >( summarySource, videoDataKeys );
		const summaryDate = getStatsTopLevelDataDate( response, query );

		return found && summaryDate
			? [ createStatsSummaryDataPoint( summaryDate, response, query, items.map( parse ) ) ]
			: [];
	};
	const summaryData = mapSummaryData();

	return {
		summary: summarySource
			? {
					...normalizeStatsSummary( summarySource, videoDataKeys ),
					...getStatsSummaryIntervalFields( query, response ),
			  }
			: {},
		data: summaryData.length
			? summaryData
			: mapStatsReportDataPoints( response, query, videoDataKeys, parse ),
	};
}
