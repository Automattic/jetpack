/**
 * Internal dependencies
 */
import { mergeStatsTopAuthorsComparisonRows } from '../processing/stats';
import { statsTopAuthorsQuery } from '../queries/stats-top-authors-query';
import { createStatsListReportHook, splitStatsListOptions } from './use-stats-report';
import type { UseStatsOptions } from './use-stats-report';
import type {
	StatsNormalizedReport,
	StatsTopAuthorsComparisonItem,
	StatsTopAuthorsItem,
} from '../processing/stats';
import type { StatsReportParams } from '../queries/stats-query';

type StatsTopAuthorsOptions = UseStatsOptions & {
	maxRows?: number;
};

export const useStatsTopAuthors = createStatsListReportHook<
	StatsReportParams,
	StatsNormalizedReport< StatsTopAuthorsItem >,
	StatsTopAuthorsComparisonItem,
	StatsTopAuthorsOptions
>( {
	queryFactory: statsTopAuthorsQuery,
	reportSlug: 'top-authors',
	mergeComparisonRows: mergeStatsTopAuthorsComparisonRows,
	getOptions: splitStatsListOptions,
} );
