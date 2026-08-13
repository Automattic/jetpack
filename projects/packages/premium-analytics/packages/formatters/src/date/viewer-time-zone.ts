/**
 * The zone the reader's own clock is in, as an identifier `Intl` accepts.
 *
 * The counterpart to `siteTimeZone()`: that one answers "what time is it at the
 * site", this one "what time is it where this is being read". Charts need the
 * second, because the chart library lays a point out and labels its axis
 * through the browser's zone.
 *
 * @return An IANA zone name.
 */
export function viewerTimeZone(): string {
	return Intl.DateTimeFormat().resolvedOptions().timeZone;
}
