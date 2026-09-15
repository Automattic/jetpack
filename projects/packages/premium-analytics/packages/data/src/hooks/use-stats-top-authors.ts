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
 * The `stats/top-authors` report. The endpoint has no author filter and ranks at
 * most 20 authors per day whatever `max` says, so a caller scoped to one author
 * asks for the whole report and picks its row; an author absent from a day may
 * simply have ranked outside that day's 20.
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
