/**
 * External dependencies
 */
import { getComparisonOptions, type ComparisonOption } from '@jetpack-premium-analytics/datetime';
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
 */
export function useComparisonDatePresets( referenceRange: DateRange ): ComparisonDateRangePreset[] {
	return useMemo( () => getComparisonOptions( referenceRange ), [ referenceRange ] );
}
