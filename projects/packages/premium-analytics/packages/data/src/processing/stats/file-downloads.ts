import { safeParseFloat } from '../../utils/parsing';
import {
	getStatsReportItems,
	limitStatsRows,
	mapStatsReportDataPoints,
	mergeStatsComparisonRows,
	normalizeStatsReportSummary,
} from './utils';
import type { StatsNormalizedItemBase, StatsNormalizedReport, StatsRecord } from './types';
import type { StatsQueryParams } from '../../utils/stats-params';

export type StatsFileDownloadsItem = StatsNormalizedItemBase & {
	downloads: number;
	shortLabel?: string;
	link?: string;
	linkTitle: unknown;
	labelIcon: string;
	children: null;
};

export type StatsFileDownloadsComparisonItem = StatsFileDownloadsItem & {
	previousDownloads?: number;
};

function getFileDownloadItemKey( item: StatsFileDownloadsItem ) {
	return item.link ?? String( item.label ?? item.shortLabel ?? '' );
}

export function sanitizeStatsFileDownloadsResponse(
	response: unknown,
	query?: StatsQueryParams
): StatsNormalizedReport< StatsFileDownloadsItem > {
	const getLink = ( item: StatsRecord ): string | undefined => {
		if ( typeof item.download_url === 'string' ) {
			return item.download_url;
		}

		return typeof item.relative_url === 'string' ? item.relative_url : undefined;
	};

	return {
		summary: normalizeStatsReportSummary( response, query, [ 'files' ] ),
		data: mapStatsReportDataPoints( response, query, [ 'files' ], item => ( {
			label: item.relative_url,
			downloads: safeParseFloat( item.download_count ?? item.downloads ),
			shortLabel: typeof item.filename === 'string' ? item.filename : undefined,
			link: getLink( item ),
			linkTitle: item.relative_url,
			labelIcon: 'external',
			children: null,
		} ) ),
	};
}

export function mergeStatsFileDownloadsComparisonRows(
	primaryReport?: StatsNormalizedReport< StatsFileDownloadsItem >,
	comparisonReport?: StatsNormalizedReport< StatsFileDownloadsItem >,
	maxRows?: number
) {
	return mergeStatsComparisonRows<
		StatsFileDownloadsItem,
		StatsFileDownloadsItem,
		StatsFileDownloadsComparisonItem
	>( {
		primaryRows: limitStatsRows( getStatsReportItems( primaryReport ), maxRows ),
		comparisonRows: getStatsReportItems( comparisonReport ),
		getPrimaryKey: getFileDownloadItemKey,
		getComparisonKey: getFileDownloadItemKey,
		getComparisonValue: item => item.downloads,
		mapRow: ( item, { previousValue } ) => ( {
			...item,
			previousDownloads: previousValue,
		} ),
	} );
}
