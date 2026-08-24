/**
 * External dependencies
 */
import { createTZDateFromParts, siteTimeZone } from '@jetpack-premium-analytics/datetime';
import { parseAsLocalDate } from '@jetpack-premium-analytics/externals';

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
	// Only the offset-stripping lives here: knowing the stamp's offset is nominal
	// is Stats API knowledge the generic parser must not have — `parseAsLocalDate`
	// rightly honours a real offset. The naive remainder is the charts library's
	// own wall-clock reading, covering every shape `date_start` arrives in
	// (`formatDatePartWithTime` stamps, and the bare or space-separated dates the
	// `getRowIntervalFields` passthrough forwards from the API).
	return parseAsLocalDate( dateStart.replace( nominalOffset, '' ).trim() );
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
