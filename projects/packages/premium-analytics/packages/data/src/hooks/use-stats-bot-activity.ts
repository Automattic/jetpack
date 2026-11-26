/**
 * External dependencies
 */
import { useMemo } from 'react';
/**
 * Internal dependencies
 */
import { statsBotActivityQuery } from '../queries/stats-bot-activity-query';
import { useStatsReport } from './use-stats-report';
import type { UseStatsOptions } from './use-stats-report';
import type { StatsBotActivityReport } from '../processing/stats';
import type { StatsReportParams } from '../queries/stats-query';
import type { ReportParams } from '../utils/search';

export { isEdgeWindowTooLong } from '../queries/edge-window';

export function useStatsBotActivity( params: ReportParams, options?: UseStatsOptions ) {
	// The report has no comparison to draw, so a host's comparison dates would only add a request.
	const reportParams = useMemo( () => ( { ...params, comp: undefined } ), [ params ] );

	return useStatsReport< StatsReportParams, StatsBotActivityReport >(
		statsBotActivityQuery,
		reportParams,
		'bot-activity',
		options
	);
}
