import { safeParseFloat } from '../../utils/parsing';
import { mapStatsReportDataPoints, normalizeStatsReportSummary } from './utils';
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
