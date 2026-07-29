/**
 * Internal dependencies
 */
import { createTZDateFromParts } from './tz';

/**
 * `YYYY-MM-DD` with an optional `HH:MM[:SS[.mmm]]` after a space or `T`, and no
 * trailing offset. This is how the Stats API returns timestamps.
 */
const OFFSETLESS_DATE_TIME =
	/^(\d{4})-(\d{2})-(\d{2})(?:[ T](\d{2}):(\d{2})(?::(\d{2}))?(?:\.\d+)?)?$/;

/**
 * Parse a timestamp into an instant, anchoring it to the site's timezone when
 * it does not state one itself.
 *
 * Two shapes reach the formatters, and they need opposite treatment:
 *
 * - The Stats API returns MySQL datetimes with no offset
 *   (`2026-07-09 09:42:57`), already expressed in site time, and report params
 *   can be date-only (`2026-01-01`). `new Date( … )` reads the first as
 *   browser-local and the second as UTC, so anything that later renders in the
 *   site's timezone shifts the calendar day. These are anchored to the site.
 * - Report params usually travel through the URL as full ISO strings that do
 *   state their offset (`2026-06-29T00:00:00.000+02:00`). Those already
 *   identify an instant; re-anchoring them would move it.
 *
 * @param value    - The raw timestamp, or a `Date`.
 * @param timeZone - The site's timezone, e.g. `'Europe/Amsterdam'`.
 * @return The instant, or `undefined` when the value is missing or malformed.
 */
export function parseSiteDateTime( value: unknown, timeZone: string ): Date | undefined {
	if ( value instanceof Date ) {
		return isNaN( value.getTime() ) ? undefined : value;
	}

	const raw = String( value ?? '' ).trim();

	if ( ! raw ) {
		return undefined;
	}

	const matched = OFFSETLESS_DATE_TIME.exec( raw );

	if ( ! matched ) {
		// Anything else is either offset-bearing (trust it) or junk (rejected by
		// the validity check).
		const parsed = new Date( raw );

		return isNaN( parsed.getTime() ) ? undefined : parsed;
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
