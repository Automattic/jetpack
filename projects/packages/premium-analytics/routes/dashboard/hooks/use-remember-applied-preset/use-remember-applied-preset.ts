/**
 * External dependencies
 */
import {
	NO_COMPARISON,
	rememberComparison,
	rememberPreset,
	type RememberedComparison,
} from '@jetpack-premium-analytics/data';
import { isSelectablePreset } from '@jetpack-premium-analytics/datetime';
import { useCallback, useRef } from '@wordpress/element';
import type { ComparisonPresetId, DateRange } from '@jetpack-premium-analytics/datetime';
import type { ReportDateFilters } from '@jetpack-premium-analytics/routing';

type StagedRange = Parameters< ReportDateFilters[ 'onChange' ] >;

/**
 * Remembers the named preset and the comparison the reader applies in the header; custom and year ranges are not kept.
 * Call each callback beside the date filters' own: a quick preset stages and applies in one tick.
 *
 * @return `onChange` and `onComparisonChange` to note a choice, `onApply` to remember it, `onCancel` to drop it.
 */
export function useRememberAppliedPreset() {
	const stagedPresetId = useRef< StagedRange[ 1 ] >( undefined );
	const stagedComparison = useRef< RememberedComparison | undefined >( undefined );

	const onChange = useCallback( ( ...[ , presetId ]: StagedRange ) => {
		stagedPresetId.current = presetId;
	}, [] );

	// `hasDraft` is the filters' `canApply` before the change: a comparison picked over a
	// staged range only applies with it.
	const onComparisonChange = useCallback(
		(
			range: DateRange | undefined,
			presetId: ComparisonPresetId | undefined,
			hasDraft: boolean
		) => {
			const comparison = range ? presetId : NO_COMPARISON;

			if ( ! comparison ) {
				return;
			}

			if ( hasDraft ) {
				stagedComparison.current = comparison;
			} else {
				rememberComparison( comparison );
			}
		},
		[]
	);

	const onApply = useCallback( () => {
		const presetId = stagedPresetId.current;
		const comparison = stagedComparison.current;
		stagedPresetId.current = undefined;
		stagedComparison.current = undefined;

		if ( isSelectablePreset( presetId ) ) {
			rememberPreset( presetId );
		}

		if ( comparison ) {
			rememberComparison( comparison );
		}
	}, [] );

	const onCancel = useCallback( () => {
		stagedPresetId.current = undefined;
		stagedComparison.current = undefined;
	}, [] );

	return { onChange, onComparisonChange, onApply, onCancel };
}
