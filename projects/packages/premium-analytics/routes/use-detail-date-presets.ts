/**
 * External dependencies
 */
import { useMemo } from '@wordpress/element';
import { isValid } from 'date-fns';
import { DETAIL_SURFACE_PRESETS } from '@jetpack-premium-analytics/datetime';

type DetailDatePresets = {
	presetIds: typeof DETAIL_SURFACE_PRESETS;
	allTimeStart: Date | undefined;
	withCustomRange: false;
};

/**
 * The date presets a resource detail page (post, video) offers, per its design:
 * all time, then the rolling windows, with no custom-range popover.
 *
 * All time starts on the day the resource was published — the earliest day its
 * report can hold data for. Until that date resolves (or when the resource has
 * none), the pill falls back to the year surface's default span rather than
 * disappear, so the range stays adjustable while the summary loads.
 *
 * @param publishedDate - The resource's publish date, as the summary carries it.
 * @return The preset props to pass to `DateFiltersPanel`.
 */
export function useDetailDatePresets( publishedDate: string | undefined ): DetailDatePresets {
	return useMemo( () => {
		// Parsed the way the summary cards parse it, so the pill and the
		// "published on" sentence agree on the day.
		const published = publishedDate ? new Date( publishedDate ) : undefined;

		return {
			presetIds: DETAIL_SURFACE_PRESETS,
			allTimeStart: published && isValid( published ) ? published : undefined,
			withCustomRange: false,
		};
	}, [ publishedDate ] );
}
