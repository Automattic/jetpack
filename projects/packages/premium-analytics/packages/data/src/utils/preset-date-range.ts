/**
 * External dependencies
 */
import { computePrimaryRange } from '@jetpack-premium-analytics/datetime';
import { getSiteTimezone, dateToISOStringWithLocalTZ } from './date';
import type { SelectablePresetId } from '@jetpack-premium-analytics/datetime';
/**
 * Internal dependencies
 */

/**
 * Compute the absolute date range for a given preset ID
 * based on the current date and the site's timezone.
 *
 * Thin wrapper over datetime's computePrimaryRange that
 * resolves the site timezone and converts Date -> ISO string.
 *
 * @param presetId - A valid selectable preset identifier.
 * @return The computed { from, to } ISO strings, or undefined
 *         if the preset is not recognized.
 */
export function computeDateRangeFromPreset(
	presetId: SelectablePresetId
): { from: string; to: string } | undefined {
	const range = computePrimaryRange( presetId, getSiteTimezone() );
	if ( ! range?.from || ! range?.to ) {
		return undefined;
	}

	return {
		from: dateToISOStringWithLocalTZ( range.from ),
		to: dateToISOStringWithLocalTZ( range.to ),
	};
}
