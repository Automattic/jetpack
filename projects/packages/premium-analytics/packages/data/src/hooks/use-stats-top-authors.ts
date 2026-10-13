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

/**
 * The `stats/top-authors` report. It has no author filter and caps `max` at 20
 * authors per period, so a single-author caller reads its row out of the whole
 * report, and an author missing from a bucket may only have ranked below the cap.
 */
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
