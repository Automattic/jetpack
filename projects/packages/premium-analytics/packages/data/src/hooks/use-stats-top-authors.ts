/**
 * External dependencies
 */
import { useCallback } from 'react';
/**
 * Internal dependencies
 */
import { mergeStatsTopAuthorsComparisonRows } from '../processing/stats';
import { statsTopAuthorsQuery } from '../queries/stats-top-authors-query';
import { useStatsReport } from './use-stats-report';
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

export function useStatsTopAuthors( params: StatsReportParams, options?: StatsTopAuthorsOptions ) {
	const { maxRows, ...queryOptions } = options ?? {};
	const mergeComparisonRows = useCallback(
		(
			primary?: StatsNormalizedReport< StatsTopAuthorsItem >,
			comparison?: StatsNormalizedReport< StatsTopAuthorsItem >
		) => mergeStatsTopAuthorsComparisonRows( primary, comparison, maxRows ),
		[ maxRows ]
	);

	return useStatsReport<
		StatsReportParams,
		StatsNormalizedReport< StatsTopAuthorsItem >,
		StatsTopAuthorsComparisonItem
	>( statsTopAuthorsQuery, params, 'top-authors', {
		...queryOptions,
		mergeComparisonRows,
	} );
}
