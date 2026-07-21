/**
 * Internal dependencies
 */
import { statsSingleVideoQuery } from '../queries/stats-single-video-query';
import { useStatsQuery } from './use-stats-query';
import type { UseStatsOptions } from './use-stats-report';
import type { StatsSingleVideoReport } from '../processing/stats';
import type { StatsSingleVideoParams } from '../queries/stats-single-video-query';

export type { StatsSingleVideoDataPoint, StatsSingleVideoPage } from '../processing/stats';
export type { StatsSingleVideoParams } from '../queries/stats-single-video-query';

export type StatsSingleVideoResponse = StatsSingleVideoReport;

export function useStatsSingleVideo(
	videoId: number,
	params?: StatsSingleVideoParams,
	options?: UseStatsOptions
) {
	return useStatsQuery( statsSingleVideoQuery( videoId, params ), options );
}
