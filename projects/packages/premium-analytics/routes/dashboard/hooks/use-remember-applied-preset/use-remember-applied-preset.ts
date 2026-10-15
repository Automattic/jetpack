/**
 * External dependencies
 */
import { rememberComparison, rememberPreset } from '@jetpack-premium-analytics/data';
import { isSelectablePreset } from '@jetpack-premium-analytics/datetime';
import { useCallback, useRef } from '@wordpress/element';
import type { ReportDateFilters } from '@jetpack-premium-analytics/routing';

type StagedRange = Parameters< ReportDateFilters[ 'onChange' ] >;

/**
 * Remembers the named preset and comparison the reader applies in the header.
 * Custom and year ranges are not kept. Call each callback beside the date filters' own:
 * a quick preset stages and applies in one tick.
 *
 * @return `onChange` and `onApply` for the preset, and `onComparisonChange` for the comparison.
 */
export function useRememberAppliedPreset() {
	const stagedPresetId = useRef< StagedRange[ 1 ] >( undefined );

	const onChange = useCallback( ( ...[ , presetId ]: StagedRange ) => {
		stagedPresetId.current = presetId;
	}, [] );

	const onApply = useCallback( () => {
		const presetId = stagedPresetId.current;
		stagedPresetId.current = undefined;

		if ( isSelectablePreset( presetId ) ) {
			rememberPreset( presetId );
		}
	}, [] );

	// Remembered at once: the menu sits outside the range popover, whose close discards any draft.
	return { onChange, onApply, onComparisonChange: rememberComparison };
}
