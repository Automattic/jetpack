/**
 * External dependencies
 */
import {
	getComparisonOptions,
	isPrimaryPreset,
	parseSiteDateTime,
} from '@jetpack-premium-analytics/datetime';
/**
 * Internal dependencies
 */
import { formatLegendLabels } from './format-legend-labels';
import type { ReportParams } from '@jetpack-premium-analytics/data';

/**
 * Name the comparison a report applies as a chart legend abbreviates it, e.g.
 * "Prev. 30 days", falling back to its date range.
 *
 * @param reportParams - Report parameters carrying the comparison.
 * @return The name, or undefined when the report compares nothing.
 */
export function getComparisonPeriodLabel( reportParams: ReportParams ): string | undefined {
	const { from, to, preset, compare_from, compare_to, compare_preset } = reportParams;

	if ( ! compare_from || ! compare_to ) {
		return undefined;
	}

	const option = compare_preset
		? getComparisonOptions(
				{ from: parseSiteDateTime( from ), to: parseSiteDateTime( to ) },
				{ primaryPresetId: isPrimaryPreset( preset ) ? preset : undefined }
			).find(
				candidate => candidate.id === compare_preset || candidate.aliases.includes( compare_preset )
			)
		: undefined;

	return option?.legendLabel ?? formatLegendLabels( reportParams ).comparison;
}
