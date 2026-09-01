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

	isOpen: boolean;
};

/**
 * Derives the custom trigger button state from staged vs applied filter state.
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

type GetCustomTriggerRangeArgs = {
	triggerState: CustomTriggerState;
	range: TriggerDateRange;
	committedRange: TriggerDateRange;
};

type GetCustomTriggerLabelArgs = GetCustomTriggerRangeArgs & {
	customLabel: string;
	formatRange: ( range: TriggerDateRange ) => string;
};

/**
 * The range the trigger itself is holding, staged or applied.
 *
 * Undefined while a preset drives the range: that range is already on screen,
 * and the trigger must not put a second one there (WOOA7S-1936).
 */
export function getCustomTriggerRange( {
	triggerState,
	range,
	committedRange,
}: GetCustomTriggerRangeArgs ): TriggerDateRange | undefined {
	if ( triggerState === 'staged' ) {
		return range;
	}

	return triggerState === 'applied' ? committedRange : undefined;
}

/**
 * Derives the custom trigger label from its visual state, falling back to the
 * custom label where the trigger holds no range of its own.
 */
export function getCustomTriggerLabel( {
	customLabel,
	formatRange,
	...triggerRangeArgs
}: GetCustomTriggerLabelArgs ): string {
	const triggerRange = getCustomTriggerRange( triggerRangeArgs );

	return triggerRange ? formatRange( triggerRange ) : customLabel;
}
