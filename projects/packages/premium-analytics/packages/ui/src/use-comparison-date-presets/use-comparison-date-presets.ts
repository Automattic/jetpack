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
 * A comparison-specific date range preset.
 * Similar to DateRangePreset but with a strongly-typed ComparisonPresetId.
 */
export type ComparisonDateRangePreset = {
	id: ComparisonPresetId;
	label: string;
	range: DateRange;
};

/**
 * Custom hook that generates comparison date presets
 * based on a reference date range.
 *
 * @param referenceRange - The primary date range to compare against
 * @return Array of comparison presets with strongly-typed IDs
 */
export function useComparisonDatePresets( referenceRange: DateRange ): ComparisonDateRangePreset[] {
	return useMemo( () => {
		if ( ! referenceRange.from || ! referenceRange.to ) {
			return [];
		}

		return getComparisonPresetConfigs()
			.map( ( { id, label } ) => {
				const range = getComparisonRangeFromPreset( referenceRange, id );
				return range ? { id, label, range } : null;
			} )
			.filter( ( preset ): preset is ComparisonDateRangePreset => preset !== null );
	}, [ referenceRange ] );
}
