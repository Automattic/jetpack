/**
 * External dependencies
 */
import {
	getAllowedIntervalsForPreset,
	resolveIntervalForRange,
} from '@jetpack-premium-analytics/data';
import { dateToISOStringWithTZ } from '@jetpack-premium-analytics/datetime';
import type { DateRange, IntervalType, PrimaryPresetId } from '@jetpack-premium-analytics/datetime';

/**
 * The buckets a story's date control offers, and the one it shows.
 *
 * @param presetId - The preset the control is on.
 * @param range    - The range being edited, which the range-based presets read.
 * @param timeZone - The story's site clock.
 * @param picked   - The bucket the control last selected.
 * @return The options, default first, and the bucket to show.
 */
export function getStoryIntervalState(
	presetId: PrimaryPresetId | undefined,
	range: DateRange,
	timeZone: string,
	picked?: IntervalType
): { options: IntervalType[]; interval: IntervalType } {
	// An absent end reads as unparseable, which the report params answer with
	// hours, so a half-built custom range behaves here as it does on a surface.
	const from = range.from ? dateToISOStringWithTZ( range.from, timeZone ) : '';
	const to = range.to ? dateToISOStringWithTZ( range.to, timeZone ) : '';

	return {
		options: getAllowedIntervalsForPreset( presetId, from, to ),
		interval: resolveIntervalForRange( presetId, from, to, picked ),
	};
}
