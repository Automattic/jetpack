/**
 * Whether a string is a well-formed WPCOM rewind id.
 *
 * Rewind ids are unix seconds with an optional decimal suffix
 * (`1786644531`, `1786644531.9425`). This is a check on the *shape* of
 * the id only — a well-formed id for a backup that does not exist still
 * passes, and is caught upstream.
 *
 * Matched against a pattern rather than parsed: `Number.parseInt` accepts
 * a numeric prefix, so `123abc` came back as `123` and rendered a January
 * 1970 restore point above a live Confirm button. A believable wrong
 * screen is worse than an obviously broken one.
 *
 * Digits alone are not enough, which is why the resulting `Date` is
 * tested rather than the parsed number: `Date` is only defined within
 * ±8.64e15 ms, so an id past that ceiling is well-formed and still makes
 * `rewindIdToIso` throw. `toFileNode` in `hooks/use-file-tree` guards a
 * WPCOM timestamp the same way and for the same reason.
 *
 * It stops at representable, not plausible. A far-future but valid date
 * is accepted; rejecting it would mean choosing an arbitrary horizon,
 * and a horizon that is wrong turns away real backups.
 *
 * @param rewindId - Candidate id, straight from the URL.
 * @return True when the id is shaped like a rewind id and names a representable date.
 */
export function isValidRewindId( rewindId: string ): boolean {
	if ( ! /^\d+(\.\d+)?$/.test( rewindId ) || Number.parseFloat( rewindId ) <= 0 ) {
		return false;
	}
	return ! Number.isNaN( new Date( Number.parseInt( rewindId, 10 ) * 1000 ).getTime() );
}

/**
 * Derive an ISO timestamp from a rewind id, for the restore-point label.
 *
 * Rewind ids are unix seconds, so the date is readable from the id alone
 * — no need to look the activity row up in cache just to render
 * "Restore point: …".
 *
 * Total for any id `isValidRewindId` accepts, which is the only way it
 * is called — that check is what makes the date representable.
 *
 * @param rewindId - A rewind id that has passed `isValidRewindId`.
 * @return ISO timestamp.
 */
export function rewindIdToIso( rewindId: string ): string {
	return new Date( Number.parseInt( rewindId, 10 ) * 1000 ).toISOString();
}
