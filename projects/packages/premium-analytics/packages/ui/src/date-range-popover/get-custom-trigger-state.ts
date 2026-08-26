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

type GetCustomTriggerLabelArgs = {
	triggerState: CustomTriggerState;
	range: TriggerDateRange;
	committedRange: TriggerDateRange;
	customLabel: string;
	formatRange: ( range: TriggerDateRange ) => string;
};

/**
 * Derives the custom trigger label from its visual state.
 *
 * Only a custom range the trigger itself is holding — staged or applied — gets
 * a date label. While a preset drives the range the trigger reads "Custom", so
 * two different ranges are never on screen at once (WOOA7S-1936).
 */
export function getCustomTriggerLabel( {
	triggerState,
	range,
	committedRange,
	customLabel,
	formatRange,
}: GetCustomTriggerLabelArgs ): string {
	if ( triggerState === 'staged' ) {
		return formatRange( range );
	}

	if ( triggerState === 'applied' ) {
		return formatRange( committedRange );
	}

	return customLabel;
}
