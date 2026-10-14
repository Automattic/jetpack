/**
 * External dependencies
 */
import { NO_COMPARISON, rememberComparison, rememberPreset } from '@jetpack-premium-analytics/data';
import { isSelectablePreset } from '@jetpack-premium-analytics/datetime';
import { useCallback, useRef } from '@wordpress/element';
import type { ReportDateFilters } from '@jetpack-premium-analytics/routing';

type StagedRange = Parameters< ReportDateFilters[ 'onChange' ] >;
type ComparisonChange = Parameters< ReportDateFilters[ 'onComparisonChange' ] >;

/**
 * Remembers the named preset and the comparison the reader applies in the header; custom and year ranges are not kept.
 * Call each callback beside the date filters' own: a quick preset stages and applies in one tick.
 *
 * @return `onChange` to note the staged preset, `onApply` to remember it, and `onComparisonChange` to remember a comparison.
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

	// The comparison menu sits outside the range popover, whose close discards any draft, so a pick applies at once.
	const onComparisonChange = useCallback( ( ...[ range, presetId ]: ComparisonChange ) => {
		const comparison = range ? presetId : NO_COMPARISON;

		if ( comparison ) {
			rememberComparison( comparison );
		}
	}, [] );

	return { onChange, onApply, onComparisonChange };
}
