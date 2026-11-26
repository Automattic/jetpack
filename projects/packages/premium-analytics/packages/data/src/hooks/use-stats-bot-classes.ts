/**
 * External dependencies
 */
import { useMemo } from 'react';
/**
 * Internal dependencies
 */
import { statsBotClassesQuery } from '../queries/stats-bot-classes-query';
import { useStatsReport } from './use-stats-report';
import type { UseStatsOptions } from './use-stats-report';
import type { StatsBotClassesReport } from '../processing/stats';
import type { StatsBotCategory, StatsBotClassesParams } from '../queries/stats-bot-classes-query';
import type { ReportParams } from '../utils/search';

export { isEdgeWindowTooLong } from '../queries/edge-window';

export function useStatsBotClasses(
	params: ReportParams,
	botCategory: StatsBotCategory,
	options?: UseStatsOptions
) {
	// The report has no comparison to draw, so a host's comparison dates would only add requests.
	const categoryParams = useMemo(
		() => ( { ...params, comp: undefined, botCategory } ),
		[ params, botCategory ]
	);

	return useStatsReport< StatsBotClassesParams, StatsBotClassesReport >(
		statsBotClassesQuery,
		categoryParams,
		`bot-classes-${ botCategory }`,
		options
	);
}
