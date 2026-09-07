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

export type SelectablePresetId = ( typeof SELECTABLE_PRESETS )[ number ];

/**
 * The all-time marker. On the year surface it covers every year the surface
 * lists; on a detail page's quick surface it runs from the resource's own start
 * (its publish date) through today.
 */
export const PRESET_ALL_TIME = 'all-time' as const;

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
 * Quick presets of a resource detail page (post, video): the rolling windows
 * led by all time, per the detail-page design.
 */
export const DETAIL_SURFACE_PRESETS = [ PRESET_ALL_TIME, ...QUICK_SURFACE_PRESETS ] as const;

/**
 * Every preset a quick surface can render as a pill: the rolling windows, plus
 * all time where the surface opts into it.
 */
export type QuickSurfacePresetId = SelectablePresetId | typeof PRESET_ALL_TIME;

/**
 * The period menu in display order, grouped by the scale each window measures.
 * Each group renders as a separated block, narrowest scale first.
 *
 * All time sits in its own group rather than with the years: it is not one, and
 * only some surfaces offer it.
 */
export const MENU_SURFACE_PRESET_GROUPS = [
	[
		PRESET_TODAY,
		PRESET_YESTERDAY,
		PRESET_LAST_24_HOURS,
		PRESET_LAST_7_DAYS,
		PRESET_LAST_30_DAYS,
		PRESET_LAST_90_DAYS,
		PRESET_LAST_365_DAYS,
	],
	[ PRESET_LAST_MONTH ],
	[ PRESET_LAST_12_MONTHS, PRESET_LAST_YEAR ],
	[ PRESET_ALL_TIME ],
] as const;

/**
 * What the period menu offers unless a surface says otherwise. All time is left
 * out: only a surface with a start date to anchor it can offer one.
 */
export const MENU_SURFACE_PRESETS = SELECTABLE_PRESETS;

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
