/**
 * Internal dependencies
 */
import { createTZDateFromParts } from './tz';

/**
 * `YYYY-MM-DD` with an optional `HH:MM[:SS]` after a space or `T`, which is
 * how the Stats API returns timestamps.
 */
const SITE_DATE_TIME = /^(\d{4})-(\d{2})-(\d{2})(?:[ T](\d{2}):(\d{2})(?::(\d{2}))?)?$/;

/**
 * Parse a timestamp that is already expressed in the site's timezone.
 *
 * The Stats API returns MySQL datetimes with no offset (`2026-07-09 09:42:57`),
 * so `new Date( … )` reads them as browser-local time. Anything that then
 * renders in the site's timezone shifts the calendar day for every visitor
 * whose zone differs from the site's — the value has to be anchored to the
 * site's zone at parse time instead.
 *
 * @param value    - The raw timestamp.
 * @param timeZone - The site's timezone, e.g. `'Europe/Amsterdam'`.
 * @return The instant, or `undefined` when the value is missing or malformed.
 */
export function parseSiteDateTime( value: unknown, timeZone: string ): Date | undefined {
	const matched = SITE_DATE_TIME.exec( String( value ?? '' ).trim() );

	if ( ! matched ) {
		return undefined;
	}

	const [ , year, month, day, hours, minutes, seconds ] = matched;
	const parsed = createTZDateFromParts(
		[
			Number( year ),
			Number( month ) - 1,
			Number( day ),
			Number( hours ?? 0 ),
			Number( minutes ?? 0 ),
			Number( seconds ?? 0 ),
		],
		timeZone
	);

	// The pattern accepts shapes the calendar does not: the Date constructor
	// rolls month 13 over into the next year rather than rejecting it, so the
	// parts have to be read back to confirm nothing was normalised away.
	const roundTrips =
		parsed.getFullYear() === Number( year ) &&
		parsed.getMonth() === Number( month ) - 1 &&
		parsed.getDate() === Number( day );

	return roundTrips ? parsed : undefined;
}
