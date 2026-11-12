/**
 * External dependencies
 */
import {
	normalizeReportParams,
	resolveIntervalForPresetChange,
	resolveIntervalForRange,
	type LockableInterval,
	type ReportParams,
} from '@jetpack-premium-analytics/data';
import {
	type ComparisonPresetId,
	type DateRange,
	type DateStepId,
	type PrimaryPresetId,
} from '@jetpack-premium-analytics/datetime';
/**
 * Internal dependencies
 */
import { deriveComparisonRange } from '../../search/comparison';
import { encodeRangeToSearchParams } from '../../search/date-range';
import {
	clearZoomOutParams,
	toZoomOutParams,
	type ZoomOutParams,
} from '../../search/report-params';

/**
 * The report search params the date filters read and stage.
 */
export type ReportQuerySearchParams = Partial<
	Omit< ReportParams, 'preset' > & {
		preset?: PrimaryPresetId;
		compare_preset?: ComparisonPresetId;
		comp?: '1';
	} & ZoomOutParams
>;

type BuildRangePatchArgs = {
	nextRange?: DateRange;

	/**
	 * The preset that produced `nextRange`, or 'custom' for manual edits.
	 */
	nextPresetId?: PrimaryPresetId;

	/**
	 * Store both ends exactly as given, skipping the end-of-day adjustment
	 * for calendar edits. For ranges derived from an already-normalized
	 * window, like stepping.
	 */
	exactRange?: boolean;

	/**
	 * Start a different named preset from its own default interval, for a
	 * preset the user picked.
	 */
	resetIntervalOnPresetChange?: boolean;

	/**
	 * How the date arrows are to step `nextRange`, when a step produced it.
	 * Any other range change clears the step the URL carries.
	 */
	step?: DateStepId;

	/**
	 * The window `nextRange` was zoomed in from, when a widget opened it: the
	 * zoom-out control returns there. Any other range change clears the window
	 * the URL carries.
	 */
	zoomedInFrom?: ReportQuerySearchParams;

	/**
	 * The current effective search params, used to re-derive the comparison
	 * range and to resolve the interval for the next range.
	 */
	effective: ReportQuerySearchParams;

	/** The buckets the plan locks; the next range's interval avoids them. */
	lockedIntervals?: readonly LockableInterval[];
};

/**
 * The zoom-out params for a window opened from `origin`: none when it is the same window
 * again, which would offer a zoom out to where the reader already is.
 *
 * @param origin - The window the new one was opened from.
 * @param from   - The new window's start, as stored.
 * @param to     - The new window's end, as stored.
 * @return The params to store.
 */
function zoomOutParams(
	origin: ReportQuerySearchParams | undefined,
	from: string,
	to: string
): ZoomOutParams | undefined {
	if ( ! origin ) {
		return undefined;
	}
	const window = normalizeReportParams( origin as Parameters< typeof normalizeReportParams >[ 0 ] );
	return window.from === from && window.to === to ? undefined : toZoomOutParams( origin );
}

/**
 * Builds the search-param patch to stage for a date-range change.
 *
 * When the change carries a range, the patch also stages an interval valid
 * for it.
 *
 * @param {BuildRangePatchArgs} args - The change and the current search state.
 * @return The patch to stage, or null when there is nothing to stage.
 */
export function buildRangePatch( {
	nextRange,
	nextPresetId,
	exactRange,
	resetIntervalOnPresetChange,
	step,
	zoomedInFrom,
	effective,
	lockedIntervals,
}: BuildRangePatchArgs ): ReportQuerySearchParams | null {
	const patch: ReportQuerySearchParams = {};

	if ( nextRange?.from && nextRange.to ) {
		const { from: rangeFrom, to: rangeTo } = encodeRangeToSearchParams(
			{ from: nextRange.from, to: nextRange.to },
			{ presetId: nextPresetId, exactRange }
		);
		patch.from = rangeFrom;
		patch.to = rangeTo;
		patch.step = step;
		Object.assign( patch, clearZoomOutParams(), zoomOutParams( zoomedInFrom, rangeFrom, rangeTo ) );

		// Without the reset, the interval carries unless the new range disallows it.
		patch.interval = resetIntervalOnPresetChange
			? resolveIntervalForPresetChange(
					effective.preset,
					nextPresetId,
					rangeFrom,
					rangeTo,
					effective.interval,
					lockedIntervals
				)
			: resolveIntervalForRange(
					nextPresetId,
					rangeFrom,
					rangeTo,
					effective.interval,
					lockedIntervals
				);

		// Loose `comp` check: an unquoted URL delivers number 1, not '1'. The
		// preset being staged measures the new range, not the one it replaces.
		if ( String( effective.comp ) === '1' ) {
			const derived = deriveComparisonRange( {
				...effective,
				from: rangeFrom,
				to: rangeTo,
				preset: nextPresetId ?? effective.preset,
			} );
			if ( derived ) {
				patch.compare_from = derived.compare_from;
				patch.compare_to = derived.compare_to;
				// May differ from the active preset: a preset the new range no
				// longer offers falls back to the previous period.
				patch.compare_preset = derived.compare_preset;
			}
		}
	}

	if ( nextPresetId ) {
		patch.preset = nextPresetId;
	}

	return Object.keys( patch ).length > 0 ? patch : null;
}
