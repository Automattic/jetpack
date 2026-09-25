/**
 * External dependencies
 */
import {
	dateToISOStringWithLocalTZ,
	endOfDayTZ,
	isSelectablePreset,
	isYearSurfacePresetId,
	localTZDate,
	reportingTimeZone,
	type DateRange,
	type PrimaryPresetId,
	type TZDate,
} from '@jetpack-premium-analytics/datetime';
import { isValid } from 'date-fns';

/**
 * Parse a stored report-param date for the picker.
 *
 * @param value    - The stored `from` or `to`.
 * @param timezone - The timezone used by the picker.
 * @return The parsed date, or undefined when it is missing or malformed.
 */
export function decodeDateSearchParam( value?: string, timezone?: string ): TZDate | undefined {
	if ( ! value ) {
		return undefined;
	}

	const date = localTZDate( value, timezone );

	return isValid( date ) ? date : undefined;
}

/**
 * Serialize a Date into an ISO string with the reporting timezone, for writing
 * to the URL or API requests.
 *
 * @param date - The date to serialize.
 * @return The ISO string, or undefined when there is no date.
 */
export function encodeDateToSearchParam( date?: Date ): string | undefined {
	return date ? dateToISOStringWithLocalTZ( date ) : undefined;
}

/**
 * Serialize a picker range into the `from`/`to` report params.
 *
 * @param range              - The range to serialize.
 * @param options            - How the range was produced.
 * @param options.presetId   - The preset that produced the range, if any.
 * @param options.exactRange - Store both bounds as given.
 * @return The serialized bounds.
 */
export function encodeRangeToSearchParams(
	range: Required< DateRange >,
	{ presetId, exactRange }: { presetId?: PrimaryPresetId; exactRange?: boolean } = {}
): { from: string; to: string } {
	return {
		from: dateToISOStringWithLocalTZ( range.from ),
		/*
		 * Preset and already-normalized ranges carry their own `to` and are stored
		 * verbatim; a calendar edit stages midnight, moved to the *site's* end of
		 * day because date-fns' bare `endOfDay` would use the visitor's.
		 */
		to: dateToISOStringWithLocalTZ(
			exactRange || isSelectablePreset( presetId ) || isYearSurfacePresetId( presetId )
				? range.to
				: endOfDayTZ( range.to, reportingTimeZone() )
		),
	};
}
