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
 * No header date control at all, for a section whose widgets host their own.
 *
 * Mirrors `Dashboard_Section::DATE_FILTER_NONE`, whose docblock carries the
 * full three-part contract. The two parts this file implements: the section
 * offers no comparison anywhere (`offersDateComparison` below), and the date
 * state is still reconciled as the range surface (`resolvePresetForSurface`
 * below), because the widget-hosted control is a range picker.
 */
export const DATE_FILTER_NONE = 'none';

/**
 * The date filter a section's header offers. Mirrors
 * `Dashboard_Section::DATE_FILTERS` on the server, which is the source of truth.
 */
export type DateFilterSurface =
	| typeof DATE_FILTER_RANGE
	| typeof DATE_FILTER_YEAR
	| typeof DATE_FILTER_NONE;

/**
 * Which optional controls a section's date filter offers. Mirrors
 * `Dashboard_Section::$date_filter_options` on the server.
 */
export type DateFilterOptions = {
	with_date_comparison: boolean;
};

/**
 * Whether the section's header offers the comparison control.
 *
 * The year surface never does; on the range surface the section decides.
 * Absent options keep the control, as every section did before the field.
 *
 * @param surface - The active section's date-filter surface.
 * @param options - The active section's date-filter options, if any.
 * @return Whether to render the comparison control.
 */
export function offersDateComparison(
	surface: DateFilterSurface,
	options: DateFilterOptions | undefined
): boolean {
	if ( surface === DATE_FILTER_YEAR || surface === DATE_FILTER_NONE ) {
		return false;
	}

	return options?.with_date_comparison ?? true;
}

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
 * a custom range. `none` falls through to the range branch on purpose: its
 * widget-hosted control is a range picker, so it needs range-shaped presets.
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
