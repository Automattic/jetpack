import { safeParseFloat } from '../../utils/parsing';
import {
	coerceStatsArray,
	createStatsDataPoint,
	getStatsBuckets,
	getStatsReportItems,
	getStatsResponsePeriod,
	limitStatsRows,
	mapStatsSummaryDataPoint,
	mergeStatsComparisonRows,
	normalizeStatsReportSummary,
} from './utils';
import type { StatsNormalizedItemBase, StatsNormalizedReport, StatsRecord } from './types';
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

function normalizeStatsSearchTerm( item: StatsRecord ): StatsSearchTermsItem {
	return {
		label: item.term,
		views: safeParseFloat( item.views ),
		className: 'user-selectable',
		children: null,
	};
}

export function sanitizeStatsSearchTermsResponse(
	response: unknown,
	query?: StatsQueryParams
): StatsNormalizedReport< StatsSearchTermsItem > {
	const summaryData = mapStatsSummaryDataPoint(
		response,
		query,
		[ 'search_terms' ],
		normalizeStatsSearchTerm
	);

	return {
		summary: normalizeStatsReportSummary( response, query, [ 'search_terms' ] ),
		data: summaryData.length
			? summaryData
			: getStatsBuckets( response, query ).map( ( [ date, bucket ] ) => ( {
					...createStatsDataPoint(
						date,
						query?.period ?? getStatsResponsePeriod( response ),
						coerceStatsArray< StatsRecord >( bucket.search_terms ).map( normalizeStatsSearchTerm )
					),
					encrypted_search_terms: bucket.encrypted_search_terms,
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
