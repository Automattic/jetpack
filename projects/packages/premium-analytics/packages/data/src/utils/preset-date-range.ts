/**
 * External dependencies
 */
import { computePrimaryRange } from '@jetpack-premium-analytics/datetime';
import { getSiteTimezone, dateToISOStringWithLocalTZ } from './date';
import type { ComputablePresetId, YearSurfaceOptions } from '@jetpack-premium-analytics/datetime';
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
 * @param presetId - A valid computable preset identifier.
 * @param options  - Year surface options. Only read for `all-time`, whose start
 *                 is a property of the surface rather than of the ID, so a
 *                 caller that knows the surface must pass it through.
 * @return The computed { from, to } ISO strings, or undefined
 *         if the preset is not recognized.
 */
export function computeDateRangeFromPreset(
	presetId: ComputablePresetId,
	options: YearSurfaceOptions = {}
): { from: string; to: string } | undefined {
	const range = computePrimaryRange( presetId, getSiteTimezone(), options );
	if ( ! range?.from || ! range?.to ) {
		return undefined;
	}

	return {
		from: dateToISOStringWithLocalTZ( range.from ),
		to: dateToISOStringWithLocalTZ( range.to ),
	};
}
