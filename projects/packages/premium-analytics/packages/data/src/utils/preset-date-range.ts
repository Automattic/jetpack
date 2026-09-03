/**
 * External dependencies
 */
import { computePrimaryRange, reportingTimeZone } from '@jetpack-premium-analytics/datetime';
import { dateToISOStringWithLocalTZ } from './date';
import type { ComputablePresetId } from '@jetpack-premium-analytics/datetime';

/**
 * Thin wrapper over datetime's `computePrimaryRange` that resolves the site
 * timezone and converts Date -> ISO string. Undefined when the preset is not
 * recognized.
 */
export function computeDateRangeFromPreset(
	presetId: ComputablePresetId
): { from: string; to: string } | undefined {
	const range = computePrimaryRange( presetId, reportingTimeZone() );
	if ( ! range?.from || ! range?.to ) {
		return undefined;
	}

	return {
		from: dateToISOStringWithLocalTZ( range.from ),
		to: dateToISOStringWithLocalTZ( range.to ),
	};
}
