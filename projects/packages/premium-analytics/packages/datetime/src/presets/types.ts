/**
 * Named constants for selectable date-range presets.
 */
export const PRESET_TODAY = 'today' as const;
export const PRESET_YESTERDAY = 'yesterday' as const;
export const PRESET_LAST_7_DAYS = 'last-7-days' as const;
export const PRESET_LAST_30_DAYS = 'last-30-days' as const;
export const PRESET_LAST_90_DAYS = 'last-90-days' as const;
export const PRESET_LAST_365_DAYS = 'last-365-days' as const;
export const PRESET_LAST_MONTH = 'last-month' as const;
export const PRESET_LAST_12_MONTHS = 'last-12-months' as const;
export const PRESET_LAST_YEAR = 'last-year' as const;

/**
 * All selectable (non-custom) preset IDs, in display order.
 */
export const SELECTABLE_PRESETS = [
	PRESET_TODAY,
	PRESET_YESTERDAY,
	PRESET_LAST_7_DAYS,
	PRESET_LAST_30_DAYS,
	PRESET_LAST_90_DAYS,
	PRESET_LAST_365_DAYS,
	PRESET_LAST_MONTH,
	PRESET_LAST_12_MONTHS,
	PRESET_LAST_YEAR,
] as const;

/**
 * Union of the 9 selectable preset identifiers.
 */
export type SelectablePresetId = ( typeof SELECTABLE_PRESETS )[ number ];

/**
 * The custom marker — not user-selectable, used as a disabled state.
 */
export const PRESET_CUSTOM = 'custom' as const;

/**
 * Primary preset: one of the 9 selectable presets, or 'custom'.
 */
export type PrimaryPresetId = SelectablePresetId | typeof PRESET_CUSTOM;

/**
 * Type guard to check if a value is a selectable preset ID.
 *
 * @param value - The value to check.
 * @return True if the value is a valid SelectablePresetId.
 */
export function isSelectablePreset( value: unknown ): value is SelectablePresetId {
	return typeof value === 'string' && ( SELECTABLE_PRESETS as readonly string[] ).includes( value );
}

/**
 * Type guard to check if a value is any primary preset ID
 * (selectable or custom).
 *
 * @param value - The value to check.
 * @return True if the value is a valid PrimaryPresetId.
 */
export function isPrimaryPreset( value: unknown ): value is PrimaryPresetId {
	return isSelectablePreset( value ) || value === PRESET_CUSTOM;
}
