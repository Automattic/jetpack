/**
 * External dependencies
 */
import { resolveIntervalForRange, type ReportQueryParams } from '@jetpack-premium-analytics/data';
import {
	endOfDayTZ,
	isSelectablePreset,
	reportingTimeZone,
	type ComparisonPresetId,
	type DateRange,
	type PrimaryPresetId,
} from '@jetpack-premium-analytics/datetime';
/**
 * Internal dependencies
 */
import { deriveComparisonRange } from '../../search/comparison';
import { encodeDateToSearchParam } from '../../search/date-range';

/**
 * The report search params the date filters read and stage.
 */
export type ReportQuerySearchParams = Partial<
	ReportQueryParams & {
		preset?: PrimaryPresetId;
		compare_preset?: ComparisonPresetId;
		comp?: '1';
	}
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
	 * The current effective search params, used to re-derive the comparison
	 * range and to resolve the interval for the next range.
	 */
	effective: ReportQuerySearchParams;
};

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
	effective,
}: BuildRangePatchArgs ): ReportQuerySearchParams | null {
	const patch: ReportQuerySearchParams = {};

	if ( nextRange?.from && nextRange.to ) {
		/*
		 * Preset/exact ranges are authoritative and skip end-of-day adjustment;
		 * calendar edits stage midnight `to`, adjusted to the *site's* end of day —
		 * date-fns' bare `endOfDay` would use the browser's and stretch the range.
		 */
		const rangeFrom = encodeDateToSearchParam( nextRange.from );
		const rangeTo = encodeDateToSearchParam(
			exactRange || isSelectablePreset( nextPresetId )
				? nextRange.to
				: endOfDayTZ( nextRange.to, reportingTimeZone() )
		);
		patch.from = rangeFrom;
		patch.to = rangeTo;

		// The interval carries across the change; the new range's rules decide
		// whether it survives or coerces to the finest allowed.
		patch.interval = resolveIntervalForRange(
			nextPresetId,
			rangeFrom,
			rangeTo,
			effective.interval
		);

		// Loose `comp` check: an unquoted URL delivers number 1, not '1'.
		if ( String( effective.comp ) === '1' ) {
			const derived = deriveComparisonRange( { ...effective, from: rangeFrom, to: rangeTo } );
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
