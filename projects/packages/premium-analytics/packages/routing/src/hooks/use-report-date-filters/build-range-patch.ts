/**
 * External dependencies
 */
import { resolveIntervalForRange, type ReportQueryParams } from '@jetpack-premium-analytics/data';
import {
	isSelectablePreset,
	type ComparisonPresetId,
	type DateRange,
	type PrimaryPresetId,
} from '@jetpack-premium-analytics/datetime';
import { endOfDay } from 'date-fns';
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
	/**
	 * The next primary range, when the change includes one.
	 */
	nextRange?: DateRange;

	/**
	 * The preset that produced `nextRange`, or 'custom' for manual edits.
	 */
	nextPresetId?: PrimaryPresetId;

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
	effective,
}: BuildRangePatchArgs ): ReportQuerySearchParams | null {
	const patch: ReportQuerySearchParams = {};

	if ( nextRange?.from && nextRange.to ) {
		/*
		 * Preset ranges are authoritative: rolling presets like
		 * last-24-hours end at the current time. Calendar and manual
		 * edits stage midnight `to` dates, so only those are adjusted
		 * to the end of the day.
		 */
		const rangeFrom = encodeDateToSearchParam( nextRange.from );
		const rangeTo = encodeDateToSearchParam(
			isSelectablePreset( nextPresetId ) ? nextRange.to : endOfDay( nextRange.to )
		);
		patch.from = rangeFrom;
		patch.to = rangeTo;

		/*
		 * Without a granularity picker, a carried-over interval can't be told
		 * apart from one inherited from the previous preset: last-7-days
		 * (`day`) into last-24-hours would bucket 24 hours into a single daily
		 * point. Keep it only within the same preset, where it is deliberate.
		 */
		const presetChanged = nextPresetId !== effective.preset;

		patch.interval = resolveIntervalForRange(
			nextPresetId,
			rangeFrom,
			rangeTo,
			presetChanged ? undefined : effective.interval
		);

		if ( effective.comp === '1' ) {
			const derived = deriveComparisonRange( { ...effective, from: rangeFrom, to: rangeTo } );
			if ( derived ) {
				patch.compare_from = derived.compare_from;
				patch.compare_to = derived.compare_to;
			}
		}
	}

	if ( nextPresetId ) {
		patch.preset = nextPresetId;
	}

	return Object.keys( patch ).length > 0 ? patch : null;
}
