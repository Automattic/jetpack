/**
 * External dependencies
 */
import { rememberPreset } from '@jetpack-premium-analytics/data';
import { isSelectablePreset } from '@jetpack-premium-analytics/datetime';
import { useCallback, useRef } from '@wordpress/element';
import type { ReportDateFilters } from '@jetpack-premium-analytics/routing';

type StagedRange = Parameters< ReportDateFilters[ 'onChange' ] >;

/**
 * Remembers a named preset the reader applies in the header; custom and year ranges are not kept.
 * Call `onChange` beside the date filters' `onChange`: a quick preset stages and applies in one tick.
 *
 * @return `onChange` to note the staged preset, and `onApply` to remember it.
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

	return { onChange, onApply };
}
