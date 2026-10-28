/**
 * External dependencies
 */
import {
	findComparisonOption,
	getComparisonOptions,
	isPrimaryPreset,
	parseSiteDateTime,
	toComparisonPresetId,
} from '@jetpack-premium-analytics/datetime';
import { isSameDay } from 'date-fns';
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
	const compareFrom = parseSiteDateTime( compare_from );
	const compareTo = parseSiteDateTime( compare_to );

	if ( ! compareFrom || ! compareTo ) {
		return undefined;
	}

	const presetId = toComparisonPresetId( compare_preset );
	const option = presetId
		? findComparisonOption(
				getComparisonOptions(
					{ from: parseSiteDateTime( from ), to: parseSiteDateTime( to ) },
					{ primaryPresetId: isPrimaryPreset( preset ) ? preset : undefined }
				),
				presetId
			)
		: undefined;

	// A rolling preset moves `from`/`to` but an old link keeps its comparison window, so the
	// preset's name only holds while it still resolves to the window the data came from.
	const matchesWindow =
		option &&
		isSameDay( option.range.from, compareFrom ) &&
		isSameDay( option.range.to, compareTo );

	return matchesWindow ? option.legendLabel : formatLegendLabels( reportParams ).comparison;
}
