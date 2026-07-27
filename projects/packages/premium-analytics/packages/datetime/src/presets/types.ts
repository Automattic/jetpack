/**
 * Named constants for selectable date-range presets.
 */
export const PRESET_TODAY = 'today' as const;
export const PRESET_YESTERDAY = 'yesterday' as const;
export const PRESET_LAST_24_HOURS = 'last-24-hours' as const;
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
	PRESET_LAST_24_HOURS,
	PRESET_LAST_7_DAYS,
	PRESET_LAST_30_DAYS,
	PRESET_LAST_90_DAYS,
	PRESET_LAST_365_DAYS,
	PRESET_LAST_MONTH,
	PRESET_LAST_12_MONTHS,
	PRESET_LAST_YEAR,
] as const;

/**
 * Quick presets shown as surface pills in the date-range filter.
 */
export const QUICK_SURFACE_PRESETS = [
	PRESET_LAST_24_HOURS,
	PRESET_LAST_7_DAYS,
	PRESET_LAST_30_DAYS,
	PRESET_LAST_12_MONTHS,
] as const;

/**
 * Union of the selectable preset identifiers.
 */
export type SelectablePresetId = ( typeof SELECTABLE_PRESETS )[ number ];

/**
 * The all-time marker: one range covering every year the year surface lists.
 */
export const PRESET_ALL_TIME = 'all-time' as const;

/**
 * Prefix of the per-year preset IDs, e.g. `year-2024`.
 */
export const YEAR_PRESET_PREFIX = 'year-' as const;

const YEAR_PRESET_PATTERN = /^year-(\d{4})$/;

/**
 * A single calendar year. Year IDs are generated at runtime rather than listed
 * in `SELECTABLE_PRESETS` because which years exist depends on the current date.
 */
export type YearPresetId = `${ typeof YEAR_PRESET_PREFIX }${ number }`;

/**
 * The presets of the year surface: all time, or one calendar year.
 */
export type YearSurfacePresetId = typeof PRESET_ALL_TIME | YearPresetId;

/**
 * Every preset whose range can be computed from its ID — the fixed rolling
 * windows plus the year surface. Excludes 'custom', which carries its own range.
 */
export type ComputablePresetId = SelectablePresetId | YearSurfacePresetId;

/**
 * The custom marker — not user-selectable, used as a disabled state.
 */
export const PRESET_CUSTOM = 'custom' as const;

/**
 * Primary preset: any computable preset, or 'custom'.
 */
export type PrimaryPresetId = ComputablePresetId | typeof PRESET_CUSTOM;

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
 * Type guard to check if a value is a per-year preset ID.
 *
 * @param value - The value to check.
 * @return True if the value is a valid YearPresetId.
 */
export function isYearPresetId( value: unknown ): value is YearPresetId {
	return typeof value === 'string' && YEAR_PRESET_PATTERN.test( value );
}

/**
 * Type guard to check if a value belongs to the year surface
 * (all time, or a single year).
 *
 * @param value - The value to check.
 * @return True if the value is a valid YearSurfacePresetId.
 */
export function isYearSurfacePresetId( value: unknown ): value is YearSurfacePresetId {
	return value === PRESET_ALL_TIME || isYearPresetId( value );
}

/**
 * Build the preset ID for a calendar year.
 *
 * @param year - Four-digit year.
 * @return The year preset ID.
 */
export function toYearPresetId( year: number ): YearPresetId {
	return `${ YEAR_PRESET_PREFIX }${ year }`;
}

/**
 * Read the calendar year back out of a preset ID.
 *
 * @param value - The candidate preset ID.
 * @return The year, or null when the value is not a year preset.
 */
export function getPresetYear( value: unknown ): number | null {
	const match = typeof value === 'string' ? YEAR_PRESET_PATTERN.exec( value ) : null;

	return match ? Number( match[ 1 ] ) : null;
}

/**
 * Type guard to check if a value is any primary preset ID
 * (selectable, year surface, or custom).
 *
 * @param value - The value to check.
 * @return True if the value is a valid PrimaryPresetId.
 */
export function isPrimaryPreset( value: unknown ): value is PrimaryPresetId {
	return isSelectablePreset( value ) || isYearSurfacePresetId( value ) || value === PRESET_CUSTOM;
}
