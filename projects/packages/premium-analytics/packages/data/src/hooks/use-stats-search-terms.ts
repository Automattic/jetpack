/**
 * External dependencies
 */
import { useCallback } from 'react';
/**
 * Internal dependencies
 */
import { mergeStatsSearchTermsComparisonRows } from '../processing/stats';
import { statsSearchTermsQuery } from '../queries/stats-search-terms-query';
import { useStatsReport } from './use-stats-report';
import type { UseStatsOptions } from './use-stats-report';
import type {
	StatsNormalizedReport,
	StatsSearchTermsComparisonItem,
	StatsSearchTermsItem,
} from '../processing/stats';
import type { StatsReportParams } from '../queries/stats-query';

type StatsSearchTermsOptions = UseStatsOptions & {
	maxRows?: number;
};

export function useStatsSearchTerms(
	params: StatsReportParams,
	options?: StatsSearchTermsOptions
) {
	const { maxRows, ...queryOptions } = options ?? {};
	const mergeComparisonRows = useCallback(
		(
			primary?: StatsNormalizedReport< StatsSearchTermsItem >,
			comparison?: StatsNormalizedReport< StatsSearchTermsItem >
		) => mergeStatsSearchTermsComparisonRows( primary, comparison, maxRows ),
		[ maxRows ]
	);

	return useStatsReport<
		StatsReportParams,
		StatsNormalizedReport< StatsSearchTermsItem >,
		StatsSearchTermsComparisonItem
	>( statsSearchTermsQuery, params, 'search-terms', {
		...queryOptions,
		mergeComparisonRows,
	} );
}
