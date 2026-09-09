/**
 * External dependencies
 */
import {
	getComparisonOptions,
	type ComparisonOption,
	type PrimaryPresetId,
} from '@jetpack-premium-analytics/datetime';
import { useMemo } from 'react';
/**
 * Internal dependencies
 */
import type { DateRange } from '../date-range-popover/date-range-filter';

/**
 * A comparison option offered for the primary range, as the dropdown consumes
 * it.
 */
export type ComparisonDateRangePreset = ComparisonOption;

/**
 * Comparison options derived from the primary range: which shifts are offered,
 * the window each resolves to, and the label naming it all follow the range —
 * see `getComparisonOptions`.
 *
 * @param referenceRange - The primary range.
 * @param presetId       - The preset that produced it, so a to-date window
 *                       compares with its previous whole period.
 * @return The comparison options, each with its range.
 */
export function useComparisonDatePresets(
	referenceRange: DateRange,
	presetId?: PrimaryPresetId
): ComparisonDateRangePreset[] {
	return useMemo(
		() => getComparisonOptions( referenceRange, { primaryPresetId: presetId } ),
		[ referenceRange, presetId ]
	);
}
