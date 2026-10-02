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
 * Provide detail date controls and hold widgets until the all-time start resolves.
 *
 * Spread dateControls after the date-filter props to disable the interval control.
 *
 * @param publishedDate               - The resource's publish date, as the summary carries it:
 *                                    a site-local wall time, or an offset-bearing instant.
 * @param dateFilters                 - The page's date-filter controller.
 * @param dateFilters.appliedPresetId - The applied preset, if any.
 * @param dateFilters.appliedRange    - The applied range.
 * @param dateFilters.replaceRange    - Commits a range in place of the current history entry.
 * @param dateFilters.timeZone        - The site timezone.
 * @param isStartPending              - Whether the start is loading or can be retried.
 * @return The date panel props and whether range-reading widgets must wait.
 */
export function useDetailDateControls(
	publishedDate: string | undefined,
	{ appliedPresetId, appliedRange, replaceRange, timeZone }: DetailDateFilters,
	isStartPending = false
): { dateControls: DetailDateControls; isAnchoringAllTime: boolean } {
	// Read in the site timezone, matching the header subtitle, so the pill and
	// the "published on" sentence name the same day for every visitor.
	const allTimeStart = useMemo( () => parseSiteDateTime( publishedDate ), [ publishedDate ] );
	const anchored = useMemo(
		() =>
			allTimeStart
				? computePrimaryRange( PRESET_ALL_TIME, timeZone, { startDate: allTimeStart } )
				: undefined,
		[ allTimeStart, timeZone ]
	);

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

	const dateControls = useMemo< DetailDateControls >(
		() => ( {
			presetIds: DETAIL_SURFACE_PRESETS,
			allTimeStart,
			withIntervalControl: false,
		} ),
		[ allTimeStart ]
	);
	const provisionalFrom = useMemo(
		() => computePrimaryRange( PRESET_ALL_TIME, timeZone )?.from.getTime(),
		[ timeZone ]
	);
	const isAnchoringAllTime =
		appliedPresetId === PRESET_ALL_TIME &&
		appliedFrom === provisionalFrom &&
		( anchored ? anchored.from.getTime() !== appliedFrom : isStartPending );

	return { dateControls, isAnchoringAllTime };
}
