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
	withIntervalControl: false;
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
 * The date controls a resource detail page (post, video) offers: the period
 * menu alone, with all time anchored to the resource's publish date. The
 * controls render before the summary loads, so an all-time range applied
 * against an unknown or stale start is re-anchored in place once it resolves.
 *
 * Spread after the date-filter controller's props: the interval props it
 * hands out are what this unsets.
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
	// Read in the site timezone, matching the header subtitle, so the pill and
	// the "published on" sentence name the same day for every visitor.
	const allTimeStart = useMemo( () => parseSiteDateTime( publishedDate ), [ publishedDate ] );
	const anchored = useAnchoredAllTime( allTimeStart, timeZone );

	const appliedFrom = appliedRange.from?.getTime();

	useEffect( () => {
		// Only the start can be stale: the end is today either way. Replacing
		// rather than pushing, so Back does not return to the unanchored range.
		if (
			anchored &&
			appliedPresetId === PRESET_ALL_TIME &&
			anchored.from.getTime() !== appliedFrom
		) {
			replaceRange( anchored, PRESET_ALL_TIME );
		}
	}, [ anchored, appliedFrom, appliedPresetId, replaceRange ] );

	return useMemo(
		() => ( {
			presetIds: DETAIL_SURFACE_PRESETS,
			allTimeStart,
			withIntervalControl: false,
		} ),
		[ allTimeStart ]
	);
}

/**
 * Whether the page is on all time but not yet anchored on the resource's start,
 * so widgets that read the range would first fetch the provisional window.
 *
 * @param allTimeStart   - The resource's start, as `useDetailDateControls` returns it.
 * @param dateFilters    - The page's date-filter controller.
 * @param isStartPending - Whether the start can still arrive; false once its summary settles.
 * @return Whether to hold the range-reading widgets back.
 */
export function useAllTimeAnchorPending(
	allTimeStart: Date | undefined,
	dateFilters: Omit< DetailDateFilters, 'replaceRange' >,
	isStartPending: boolean
): boolean {
	const anchored = useAnchoredAllTime( allTimeStart, dateFilters.timeZone );

	if ( dateFilters.appliedPresetId !== PRESET_ALL_TIME ) {
		return false;
	}

	return anchored
		? anchored.from.getTime() !== dateFilters.appliedRange.from?.getTime()
		: isStartPending;
}

/**
 * The all-time range anchored on the resource's start, once the start is known.
 *
 * @param allTimeStart - The resource's start.
 * @param timeZone     - The site timezone.
 * @return The anchored range, or undefined without a start.
 */
function useAnchoredAllTime( allTimeStart: Date | undefined, timeZone: string ) {
	return useMemo(
		() =>
			allTimeStart
				? computePrimaryRange( PRESET_ALL_TIME, timeZone, { startDate: allTimeStart } )
				: undefined,
		[ allTimeStart, timeZone ]
	);
}
