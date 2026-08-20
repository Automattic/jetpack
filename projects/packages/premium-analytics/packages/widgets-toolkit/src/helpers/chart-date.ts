/**
 * External dependencies
 */
import { createTZDateFromParts, siteTimeZone } from '@jetpack-premium-analytics/datetime';

const nominalOffset = /(?:Z|[+-]\d{2}:?\d{2})$/;

/**
 * Read a bucket's `date_start` as the wall clock it names.
 *
 * Bucket stamps carry a nominal `+00:00` rather than a real offset (see
 * `getStatsIntervalFields`), and the chart library lays a point out and labels
 * the axis through the browser's timezone — so keeping the offset shifts every
 * label by the viewer's own offset, turning a midnight bucket into the previous
 * day west of UTC. Dropping it and parsing the remaining wall clock locally
 * keeps a label on the bucket it names.
 *
 * The instant this produces is therefore only meaningful as a wall clock. Read
 * it back with `fromChartDate` before handing it to a date formatter, which
 * resolves the site's timezone rather than the browser's.
 *
 * @param dateStart - The bucket's `date_start`.
 * @return The bucket's wall clock as a local instant.
 */
export function toChartDate( dateStart: string ): Date {
	const wallClock = dateStart.replace( nominalOffset, '' ).trim();

	// Rebuilt from its parts rather than parsed as-is: a bare `yyyy-MM-dd` parses
	// as UTC rather than as the local wall clock, which would reintroduce the same
	// day shift, and a space-separated stamp does not parse at all in every engine.
	// Most branches stamp a time via `formatDatePartWithTime`, but the
	// `row.date_start` passthrough in `getRowIntervalFields` forwards whatever the
	// API sent, so both shapes reach here.
	const [ datePart, timePart = '00:00:00' ] = wallClock.split( /[T ]/ );

	return new Date( `${ datePart }T${ timePart }` );
}

/**
 * Re-anchor a chart point's wall clock in the site's timezone.
 *
 * The inverse of `toChartDate`: it hands back the instant the bucket named, so
 * the site's date formatters read out the clock the axis drew rather than one
 * shifted by the offset between the viewer's timezone and the site's. Every
 * label derived from a chart point — a tooltip's date, a legend's range — goes
 * through here first.
 *
 * @param date - A chart point's date.
 * @return The same wall clock, anchored in the site's timezone.
 */
export function fromChartDate( date: Date ): Date {
	return createTZDateFromParts(
		[
			date.getFullYear(),
			date.getMonth(),
			date.getDate(),
			date.getHours(),
			date.getMinutes(),
			date.getSeconds(),
		],
		siteTimeZone()
	);
}
