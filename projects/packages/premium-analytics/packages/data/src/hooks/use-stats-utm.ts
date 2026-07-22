/**
 * External dependencies
 */
import { useCallback } from 'react';
/**
 * Internal dependencies
 */
import { mergeStatsUtmComparisonRows } from '../processing/stats';
import { statsUtmQuery } from '../queries/stats-utm-query';
import { useStatsReport } from './use-stats-report';
import type { UseStatsOptions } from './use-stats-report';
import type { StatsUtmComparisonItem } from '../processing/stats';
import type { StatsUtmParams, StatsUtmResponse } from '../queries/stats-utm-query';

export type { StatsUtmParams, StatsUtmResponse } from '../queries/stats-utm-query';

type StatsUtmOptions = UseStatsOptions & {
	maxRows?: number;
};

export function useStatsUtm( params: StatsUtmParams, options?: StatsUtmOptions ) {
	const { maxRows, ...queryOptions } = options ?? {};
	const mergeComparisonRows = useCallback(
		( primary?: StatsUtmResponse, comparison?: StatsUtmResponse ) =>
			mergeStatsUtmComparisonRows( primary, comparison, maxRows ),
		[ maxRows ]
	);

	return useStatsReport< StatsUtmParams, StatsUtmResponse, StatsUtmComparisonItem >(
		statsUtmQuery,
		params,
		[ 'stats', 'utm', '__comparison__', 'disabled' ],
		{
			...queryOptions,
			mergeComparisonRows,
		}
	);
}
