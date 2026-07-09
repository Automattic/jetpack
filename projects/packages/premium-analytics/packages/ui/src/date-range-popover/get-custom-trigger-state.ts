/**
 * External dependencies
 */
import { PRESET_CUSTOM, type PrimaryPresetId } from '@jetpack-premium-analytics/datetime';

/**
 * Visual state for the custom date-range trigger button.
 */
export type CustomTriggerState = 'idle' | 'staged' | 'applied';

type GetCustomTriggerStateArgs = {
	/**
	 * Staged preset from search state.
	 */
	presetId?: PrimaryPresetId;

	/**
	 * Committed preset. Falls back to `presetId` when omitted.
	 */
	appliedPresetId?: PrimaryPresetId;

	/**
	 * Whether staged primary filters differ from the applied values.
	 */
	canApply: boolean;

	/**
	 * Whether the custom-range popover is open.
	 */
	isOpen: boolean;
};

/**
 * Derives the custom trigger button state from staged vs applied filter state.
 *
 * @param {GetCustomTriggerStateArgs} args - Staged/applied preset IDs and apply/open flags.
 * @return The trigger visual state.
 */
export function getCustomTriggerState( {
	presetId,
	appliedPresetId,
	canApply,
	isOpen,
}: GetCustomTriggerStateArgs ): CustomTriggerState {
	const appliedPreset = appliedPresetId ?? presetId;
	const isAppliedCustom = ! appliedPreset || appliedPreset === PRESET_CUSTOM;
	const isStagedCustom = ! presetId || presetId === PRESET_CUSTOM;

	if ( isAppliedCustom && ! canApply ) {
		return 'applied';
	}

	if ( isStagedCustom && ( canApply || isOpen ) ) {
		return 'staged';
	}

	return 'idle';
}
