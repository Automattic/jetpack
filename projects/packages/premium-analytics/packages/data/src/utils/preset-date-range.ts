/**
 * External dependencies
 */
import { computePrimaryRange, siteTimeZone } from '@jetpack-premium-analytics/datetime';
import { dateToISOStringWithLocalTZ } from './date';
import type { AllTimeRangeOptions, ComputablePresetId } from '@jetpack-premium-analytics/datetime';

/**
 * Thin wrapper over datetime's `computePrimaryRange` that resolves the site
 * timezone and converts Date -> ISO string. Undefined when the preset is not
 * recognized.
 *
 * @param presetId - The preset to resolve.
 * @param options  - Where all time starts; read only for the all-time preset.
 * @return The range as ISO strings, or undefined for an unknown preset.
 */
export function computeDateRangeFromPreset(
	presetId: ComputablePresetId,
	options?: AllTimeRangeOptions
): { from: string; to: string } | undefined {
	const range = computePrimaryRange( presetId, siteTimeZone(), options );
	if ( ! range?.from || ! range?.to ) {
		return undefined;
	}

	return {
		from: dateToISOStringWithLocalTZ( range.from ),
		to: dateToISOStringWithLocalTZ( range.to ),
	};
}
