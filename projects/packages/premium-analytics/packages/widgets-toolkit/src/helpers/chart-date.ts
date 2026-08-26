/**
 * External dependencies
 */
import { createTZDateFromParts, siteTimeZone } from '@jetpack-premium-analytics/datetime';
import { parseAsLocalDate } from '@jetpack-premium-analytics/externals';

const nominalOffset = /(?:Z|[+-]\d{2}:?\d{2})$/;

/**
 * Read a bucket's `date_start` as the wall clock it names.
 *
 * Bucket stamps name site-local wall times (see `getStatsIntervalFields`), and
 * the chart library lays a point out and labels the axis through the browser's
 * timezone — so honouring an offset would shift every label by the viewer's own
 * offset, turning a midnight bucket into the previous day west of UTC. Parsing
 * the wall clock locally keeps a label on the bucket it names.
 *
 * The instant this produces is therefore only meaningful as a wall clock. Read
 * it back with `fromChartDate` before handing it to a date formatter, which
 * resolves the site's timezone rather than the browser's.
 *
 * @param dateStart - The bucket's `date_start`.
 * @return The bucket's wall clock as a local instant.
 */
export function toChartDate( dateStart: string ): Date {
	// The normalizers emit naive stamps, but the `getRowIntervalFields`
	// passthrough forwards whatever `date_start` the API sent, which can still
	// carry a nominal offset — knowing that offset is a label is Stats API
	// knowledge the generic parser must not have, so it is stripped here before
	// the charts library's own wall-clock reading handles the naive remainder.
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
