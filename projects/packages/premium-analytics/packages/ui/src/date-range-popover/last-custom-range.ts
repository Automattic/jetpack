/**
 * External dependencies
 */
import { PRESET_CUSTOM, type PrimaryPresetId } from '@jetpack-premium-analytics/datetime';

type CommittedDateRange = {
	from?: Date;
	to?: Date;
};

export type RememberedCustomRange = {
	from: Date;
	to: Date;
};

/**
 * Returns the committed custom range when the applied preset is custom.
 *
 * @param appliedPresetId - Committed preset identifier.
 * @param appliedRange    - Committed date range.
 * @return The custom range to remember, or null.
 */
export function getCommittedCustomRange(
	appliedPresetId: PrimaryPresetId | undefined,
	appliedRange: CommittedDateRange | undefined
): RememberedCustomRange | null {
	if ( appliedPresetId !== PRESET_CUSTOM || ! appliedRange?.from || ! appliedRange.to ) {
		return null;
	}

	return {
		from: appliedRange.from,
		to: appliedRange.to,
	};
}

type ShouldRestoreLastCustomRangeArgs = {
	isOpen: boolean;
	appliedPresetId?: PrimaryPresetId;
	presetId?: PrimaryPresetId;
	hasLastCustomRange: boolean;
};

/**
 * Whether opening the custom popover should restore the last committed custom range.
 *
 * @param {ShouldRestoreLastCustomRangeArgs} args - Open/applied/staged preset state.
 * @return True when the saved custom range should be staged again.
 */
export function shouldRestoreLastCustomRange( {
	isOpen,
	appliedPresetId,
	presetId,
	hasLastCustomRange,
}: ShouldRestoreLastCustomRangeArgs ): boolean {
	return (
		isOpen && hasLastCustomRange && appliedPresetId !== PRESET_CUSTOM && presetId !== PRESET_CUSTOM
	);
}
