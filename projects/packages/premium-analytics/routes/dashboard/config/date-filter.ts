/**
 * External dependencies
 */
import {
	getDefaultPreset,
	getPolicyDefaultPreset,
	OPEN_DATE_POLICY,
	type StatsDatePolicy,
} from '@jetpack-premium-analytics/data';
import {
	PRESET_ALL_TIME,
	computePrimaryRange,
	isYearSurfacePresetId,
	type ComputablePresetId,
	type DateRange,
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
 * The shape a section's date filter takes — not where it renders, and not what
 * it supports, which are `DateFilterOptions`. Mirrors
 * `Dashboard_Section::DATE_FILTERS` on the server, which is the source of truth.
 */
export type DateFilterSurface = typeof DATE_FILTER_RANGE | typeof DATE_FILTER_YEAR;

/**
 * The surface a section's registered `date_filter` resolves to: `year` is the only opt-in.
 *
 * @param dateFilter - The section's `date_filter` value.
 * @return The surface.
 */
export function toDateFilterSurface( dateFilter: string | undefined ): DateFilterSurface {
	return dateFilter === DATE_FILTER_YEAR ? DATE_FILTER_YEAR : DATE_FILTER_RANGE;
}

/**
 * What a section's date filter supports, and where it renders. Mirrors
 * `Dashboard_Section::$date_filter_options` on the server.
 */
export type DateFilterOptions = {
	with_date_comparison: boolean;
	// Optional: a payload served before this field existed carries no placement.
	with_header_date_control?: boolean;
	with_header_interval_control?: boolean;
};

/**
 * Whether the section supports period-over-period comparison at all.
 *
 * Not just chrome: false has `WidgetRoot` drop the comparison from the params
 * every widget in the section fetches and renders with.
 *
 * @param surface - The active section's date-filter surface.
 * @param options - The active section's date-filter options, if any.
 * @return Whether the section supports comparison.
 */
export function offersDateComparison(
	surface: DateFilterSurface,
	options: DateFilterOptions | undefined
): boolean {
	if ( surface === DATE_FILTER_YEAR ) {
		return false;
	}

	return options?.with_date_comparison ?? true;
}

/**
 * The preset a surface should switch to when the current URL preset is
 * incompatible with it, or `null` when it already fits. A range surface with
 * no preset is left alone — that's how a `?from=&to=` deep link works.
 *
 * @param surface  - The active section's date-filter surface.
 * @param presetId - The preset currently in the URL, if any.
 * @param policy   - The plan's date policy, for a section that follows it.
 * @return The preset to switch to, or null when no switch is needed.
 */
export function resolvePresetForSurface(
	surface: DateFilterSurface,
	presetId: unknown,
	policy: StatsDatePolicy = OPEN_DATE_POLICY
): ComputablePresetId | null {
	if ( surface === DATE_FILTER_YEAR ) {
		return isYearSurfacePresetId( presetId ) ? null : PRESET_ALL_TIME;
	}

	// The year surface has no custom range, so a year preset can only have come
	// from another section. Land on the reader's default, or the plan's fallback if it locks that.
	return isYearSurfacePresetId( presetId )
		? getPolicyDefaultPreset( policy, getDefaultPreset() )
		: null;
}

/**
 * The preset and range a surface moves an incompatible preset to, or null when it already fits.
 *
 * @param surface  - The section's date-filter surface.
 * @param presetId - The preset currently in the URL, if any.
 * @param policy   - The date policy the section follows.
 * @param timeZone - The site's reporting timezone.
 * @return The preset and its range, or null.
 */
export function resolveSurfaceRange(
	surface: DateFilterSurface,
	presetId: unknown,
	policy: StatsDatePolicy,
	timeZone: string
): { presetId: ComputablePresetId; range: Required< DateRange > } | null {
	const nextPresetId = resolvePresetForSurface( surface, presetId, policy );
	const range = nextPresetId ? computePrimaryRange( nextPresetId, timeZone ) : undefined;

	return nextPresetId && range ? { presetId: nextPresetId, range } : null;
}
