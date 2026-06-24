/**
 * Internal dependencies
 */
import { statsSingleVideoQuery } from '../queries/stats-single-video-query';
import { useStatsQuery } from './use-stats-query';
import type { UseStatsOptions } from './use-stats-report';
import type { StatsQueryParams } from '../utils/stats-params';

export function useStatsSingleVideo(
	videoId: number,
	params?: StatsQueryParams,
	options?: UseStatsOptions
) {
	return useStatsQuery( statsSingleVideoQuery( videoId, params ), options );
}
