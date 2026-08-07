/**
 * External dependencies
 */
import { getDefaultPreset } from '@jetpack-premium-analytics/data';
import {
	PRESET_ALL_TIME,
	isYearSurfacePresetId,
	type ComputablePresetId,
	type PrimaryPresetId,
} from '@jetpack-premium-analytics/datetime';

/**
 * The rolling date-range picker plus the comparison control — what every
 * section shows unless it opts out.
 */
export const DATE_FILTER_RANGE = 'range';

/**
 * All time plus one entry per calendar year, for sections whose data is read as
 * whole history rather than as a rolling window.
 */
export const DATE_FILTER_YEAR = 'year';

/**
 * The date filter a section's header offers. Mirrors
 * `Dashboard_Section::DATE_FILTERS` on the server, which is the source of truth.
 */
export type DateFilterSurface = typeof DATE_FILTER_RANGE | typeof DATE_FILTER_YEAR;

/**
 * The preset a surface should take over with when the URL carries one it cannot
 * represent, or `null` when the current preset is already coherent.
 *
 * `?preset=` is shared by every section, so switching sections can land a
 * rolling window on the year surface — where no pill matches it and the whole
 * control reads as unset — or a single year on the range surface, where the
 * picker would label it a custom range. Rather than leave either looking blank,
 * the surface the user is now looking at takes over with its own default: all
 * time for the year surface, the shared default preset for the range surface.
 *
 * Presets a surface can represent are left alone. That includes an absent
 * preset on the range surface, which is how a `?from=&to=` deep link expresses
 * a custom range.
 *
 * @param surface  - The active section's date-filter surface.
 * @param presetId - The preset currently in the URL, if any.
 * @return The preset to switch to, or null when no switch is needed.
 */
export function resolvePresetForSurface(
	surface: DateFilterSurface,
	presetId: PrimaryPresetId | undefined
): ComputablePresetId | null {
	if ( surface === DATE_FILTER_YEAR ) {
		return isYearSurfacePresetId( presetId ) ? null : PRESET_ALL_TIME;
	}

	// The year surface has no custom range, so a year preset can only have come
	// from another section. Fall back to the same preset a fresh load seeds.
	return isYearSurfacePresetId( presetId ) ? getDefaultPreset() : null;
}
