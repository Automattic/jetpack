/**
 * External dependencies
 */
import {
	getComparisonRangeFromPreset,
	getComparisonPresetConfigs,
	type ComparisonPresetId,
} from '@jetpack-premium-analytics/datetime';
import { useMemo } from 'react';
/**
 * Internal dependencies
 */
import type { DateRange } from '../date-range-popover/date-range-filter';

/**
 * `DateRangePreset` narrowed to a `ComparisonPresetId`.
 */
export type ComparisonDateRangePreset = {
	id: ComparisonPresetId;
	label: string;
	/**
	 * Abbreviated label for the picker's trigger, e.g. "Prev. period".
	 */
	shortLabel: string;
	range: DateRange;
};

/**
 * Comparison presets derived from the primary range, dropping any the range
 * cannot support.
 */
export function useComparisonDatePresets( referenceRange: DateRange ): ComparisonDateRangePreset[] {
	return useMemo( () => {
		if ( ! referenceRange.from || ! referenceRange.to ) {
			return [];
		}

		return getComparisonPresetConfigs()
			.map( ( { id, label, shortLabel } ) => {
				const range = getComparisonRangeFromPreset( referenceRange, id );
				return range ? { id, label, shortLabel, range } : null;
			} )
			.filter( ( preset ): preset is ComparisonDateRangePreset => preset !== null );
	}, [ referenceRange ] );
}
