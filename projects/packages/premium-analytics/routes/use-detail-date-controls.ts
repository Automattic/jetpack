/**
 * External dependencies
 */
import { useMemo } from '@wordpress/element';
import { isValid } from 'date-fns';
import { DETAIL_SURFACE_PRESETS } from '@jetpack-premium-analytics/datetime';

type DetailDateControls = {
	presetIds: typeof DETAIL_SURFACE_PRESETS;
	allTimeStart: Date | undefined;
	withCustomRange: false;
	withIntervalControl: false;
	onStep: undefined;
};

/**
 * The date controls a resource detail page (post, video) offers, per its
 * design: the preset pills alone — all time, then the rolling windows — with no
 * custom-range popover, no period-navigation arrows, and no chart-interval
 * dropdown. The charts bucket by the interval the range resolves on its own.
 *
 * All time starts on the day the resource was published — the earliest day its
 * report can hold data for. Until that date resolves (or when the resource has
 * none), the pill falls back to the year surface's default span rather than
 * disappear, so the range stays adjustable while the summary loads.
 *
 * Spread after the date-filter controller's props: `onStep` and the interval
 * props it hands out are what this unsets.
 *
 * @param publishedDate - The resource's publish date, as the summary carries it.
 * @return The props to pass to `DateFiltersPanel`.
 */
export function useDetailDateControls( publishedDate: string | undefined ): DetailDateControls {
	return useMemo( () => {
		// Parsed the way the summary cards parse it, so the pill and the
		// "published on" sentence agree on the day.
		const published = publishedDate ? new Date( publishedDate ) : undefined;

		return {
			presetIds: DETAIL_SURFACE_PRESETS,
			allTimeStart: published && isValid( published ) ? published : undefined,
			withCustomRange: false,
			withIntervalControl: false,
			onStep: undefined,
		};
	}, [ publishedDate ] );
}
