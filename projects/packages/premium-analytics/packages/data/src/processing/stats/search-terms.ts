import { safeParseFloat } from '../../utils/parsing';
import {
	getStatsReportItems,
	limitStatsRows,
	mapStatsReportDataPoints,
	mergeStatsComparisonRows,
	normalizeStatsReportSummary,
} from './utils';
import type { StatsNormalizedItemBase, StatsNormalizedReport } from './types';
import type { StatsQueryParams } from '../../utils/stats-params';

export type StatsSearchTermsItem = StatsNormalizedItemBase & {
	views: number;
	className: string;
	children: null;
};

export type StatsSearchTermsComparisonItem = StatsSearchTermsItem & {
	previousViews?: number;
};

function getSearchTermKey( item: StatsSearchTermsItem ): string {
	return typeof item.label === 'string' ? item.label : String( item.label );
}

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

export function mergeStatsSearchTermsComparisonRows(
	primaryReport?: StatsNormalizedReport< StatsSearchTermsItem >,
	comparisonReport?: StatsNormalizedReport< StatsSearchTermsItem >,
	maxRows?: number
) {
	return mergeStatsComparisonRows<
		StatsSearchTermsItem,
		StatsSearchTermsItem,
		StatsSearchTermsComparisonItem
	>( {
		primaryRows: limitStatsRows( getStatsReportItems( primaryReport ), maxRows ),
		comparisonRows: getStatsReportItems( comparisonReport ),
		getPrimaryKey: getSearchTermKey,
		getComparisonKey: getSearchTermKey,
		getComparisonValue: item => item.views,
		mapRow: ( item, { previousValue } ) => ( {
			...item,
			previousViews: previousValue,
		} ),
	} );
}
