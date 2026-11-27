/**
 * Internal dependencies
 */
import { mergeStatsBotActivityComparisonRows } from '../processing/stats';
import { statsBotActivityQuery } from '../queries/stats-bot-activity-query';
import { useStatsReport } from './use-stats-report';
import type { UseStatsOptions } from './use-stats-report';
import type { StatsBotActivityComparisonGroup, StatsBotActivityReport } from '../processing/stats';
import type { StatsReportParams } from '../queries/stats-query';
import type { ReportParams } from '../utils/search';

export { isEdgeWindowTooLong } from '../queries/edge-window';

export function useStatsBotActivity( params: ReportParams, options?: UseStatsOptions ) {
	return useStatsReport<
		StatsReportParams,
		StatsBotActivityReport,
		StatsBotActivityComparisonGroup
	>( statsBotActivityQuery, params, 'bot-activity', {
		...options,
		mergeComparisonRows: mergeStatsBotActivityComparisonRows,
	} );
}
