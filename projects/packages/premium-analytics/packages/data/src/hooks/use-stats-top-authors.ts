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
 * The `stats/top-authors` report. The endpoint has no author filter and caps
 * `max` at 20 authors per period (`TOP_AUTHORS_PER_DAY_LIMIT` on the wpcom
 * endpoint), so a caller scoped to one author asks for the whole report and
 * picks its row; an author absent from a bucket may simply have ranked below it.
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
