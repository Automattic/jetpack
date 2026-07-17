/**
 * Internal dependencies
 */
import { mergeStatsSearchTermsComparisonRows } from '../processing/stats';
import { statsSearchTermsQuery } from '../queries/stats-search-terms-query';
import { createStatsListReportHook } from './use-stats-report';
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

export const useStatsSearchTerms = createStatsListReportHook<
	StatsReportParams,
	StatsNormalizedReport< StatsSearchTermsItem >,
	StatsSearchTermsComparisonItem,
	StatsSearchTermsOptions
>( {
	queryFactory: statsSearchTermsQuery,
	reportSlug: 'search-terms',
	mergeComparisonRows: mergeStatsSearchTermsComparisonRows,
} );
