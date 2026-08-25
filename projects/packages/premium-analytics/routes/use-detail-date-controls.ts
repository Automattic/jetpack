/**
 * External dependencies
 */
import { useEffect, useMemo } from '@wordpress/element';
import {
	DETAIL_SURFACE_PRESETS,
	PRESET_ALL_TIME,
	computePrimaryRange,
	parseSiteDateTime,
	type DateRange,
	type PrimaryPresetId,
} from '@jetpack-premium-analytics/datetime';

type DetailDateControls = {
	presetIds: typeof DETAIL_SURFACE_PRESETS;
	allTimeStart: Date | undefined;
	withCustomRange: false;
	withIntervalControl: false;
	onStep: undefined;
};

/**
 * The slice of the date-filter controller the all-time anchor reconciles
 * against.
 */
type DetailDateFilters = {
	appliedPresetId?: PrimaryPresetId;
	appliedRange: { from?: Date; to?: Date };
	replaceRange: ( range: DateRange, presetId: PrimaryPresetId ) => void;
	timeZone: string;
};

/**
 * The date controls a resource detail page (post, video) offers, per its
 * design: the preset pills alone — all time, then the rolling windows — with no
 * custom-range popover, no period-navigation arrows, and no chart-interval
 * dropdown. The charts bucket by the interval the range resolves on its own.
 *
 * All time starts on the day the resource was published — the earliest day its
 * report can hold data for. The controls render while the summary is still
 * loading, so an all-time range applied before that day is known (or deep-linked
 * with a stale start) is re-anchored in place once it resolves; a resource with
 * no readable date keeps the year surface's default span.
 *
 * Spread after the date-filter controller's props: `onStep` and the interval
 * props it hands out are what this unsets.
 *
 * @param publishedDate               - The resource's publish date, as the summary carries it:
 *                                    a site-local wall time, or an offset-bearing instant.
 * @param dateFilters                 - The page's date-filter controller.
 * @param dateFilters.appliedPresetId - The applied preset, if any.
 * @param dateFilters.appliedRange    - The applied range.
 * @param dateFilters.replaceRange    - Commits a range in place of the current history entry.
 * @param dateFilters.timeZone        - The site timezone.
 * @return The props to pass to `DateFiltersPanel`.
 */
export function useDetailDateControls(
	publishedDate: string | undefined,
	{ appliedPresetId, appliedRange, replaceRange, timeZone }: DetailDateFilters
): DetailDateControls {
	// Read in the site timezone, the way the summary cards show it, so the pill
	// and the "published on" sentence agree on the day for every visitor.
	const allTimeStart = useMemo( () => parseSiteDateTime( publishedDate ), [ publishedDate ] );

	const appliedFrom = appliedRange.from?.getTime();

	useEffect( () => {
		if ( ! allTimeStart || appliedPresetId !== PRESET_ALL_TIME ) {
			return;
		}

		const anchored = computePrimaryRange( PRESET_ALL_TIME, timeZone, {
			startDate: allTimeStart,
		} );

		// Only the start can be stale: the end is today either way. Replacing
		// rather than pushing, so Back does not return to the unanchored range.
		if ( anchored && anchored.from.getTime() !== appliedFrom ) {
			replaceRange( anchored, PRESET_ALL_TIME );
		}
	}, [ allTimeStart, appliedFrom, appliedPresetId, replaceRange, timeZone ] );

	return useMemo(
		() => ( {
			presetIds: DETAIL_SURFACE_PRESETS,
			allTimeStart,
			withCustomRange: false,
			withIntervalControl: false,
			onStep: undefined,
		} ),
		[ allTimeStart ]
	);
}
