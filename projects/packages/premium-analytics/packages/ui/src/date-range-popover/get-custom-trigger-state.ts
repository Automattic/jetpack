/**
 * External dependencies
 */
import { PRESET_CUSTOM, type PrimaryPresetId } from '@jetpack-premium-analytics/datetime';

type TriggerDateRange = {
	from?: Date;
	to?: Date;
};

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

type GetCustomTriggerLabelArgs = {
	triggerState: CustomTriggerState;
	range: TriggerDateRange;
	committedRange: TriggerDateRange;
	rememberedCustomRange?: TriggerDateRange | null;
	customLabel: string;
	formatRange: ( range: TriggerDateRange ) => string;
};

/**
 * Derives the custom trigger label from visual state and remembered ranges.
 *
 * @param {GetCustomTriggerLabelArgs} args - Trigger state, staged/applied ranges, and formatters.
 * @return The trigger button label.
 */
export function getCustomTriggerLabel( {
	triggerState,
	range,
	committedRange,
	rememberedCustomRange,
	customLabel,
	formatRange,
}: GetCustomTriggerLabelArgs ): string {
	if ( triggerState === 'staged' ) {
		return formatRange( range );
	}

	if ( triggerState === 'applied' ) {
		return formatRange( committedRange );
	}

	if ( rememberedCustomRange?.from && rememberedCustomRange.to ) {
		return formatRange( rememberedCustomRange );
	}

	return customLabel;
}
