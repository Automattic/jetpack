/**
 * External dependencies
 */
import {
	dateToISOStringWithTZ,
	localTZDate,
	reportingTimeZone,
} from '@jetpack-premium-analytics/datetime';
import { isValid } from 'date-fns';

/**
 * Parse a stored report-param date for the picker.
 *
 * @param value    - The stored `from` or `to`.
 * @param timezone - The timezone used by the picker.
 * @return The parsed date, or undefined when it is missing or malformed.
 */
export function decodeDateSearchParam( value?: string, timezone?: string ): Date | undefined {
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
 * @param date     - The date to serialize.
 * @param timezone - The zone to serialize in, the reporting timezone when omitted.
 * @return The ISO string, or undefined when there is no date.
 */
export function encodeDateToSearchParam( date?: Date, timezone?: string ): string | undefined {
	return date ? dateToISOStringWithTZ( date, timezone ?? reportingTimeZone() ) : undefined;
}
