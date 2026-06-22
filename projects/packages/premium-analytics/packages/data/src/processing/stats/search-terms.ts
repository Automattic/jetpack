import { safeParseFloat } from '../../utils/parsing';
import { mapStatsReportDataPoints, normalizeStatsReportSummary } from './foundation';
import type { StatsNormalizedReport, StatsSearchTermsItem } from './types';
import type { StatsQueryParams } from '../../utils/stats-params';

export function sanitizeStatsSearchTermsResponse(
	response: unknown,
	query?: StatsQueryParams
): StatsNormalizedReport< StatsSearchTermsItem > {
	return {
		summary: normalizeStatsReportSummary( response, query, [ 'search_terms' ] ),
		data: mapStatsReportDataPoints( response, query, [ 'search_terms' ], item => ( {
			label: item.term,
			views: safeParseFloat( item.views ),
			className: 'user-selectable',
			children: null,
		} ) ),
	};
}
