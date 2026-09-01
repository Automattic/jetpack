/**
 * External dependencies
 */
import { createTZDateFromParts, siteTimeZone } from '@jetpack-premium-analytics/datetime';
import { parseAsLocalDate } from '@jetpack-premium-analytics/externals';

const nominalOffset = /(?:Z|[+-]\d{2}:?\d{2})$/;

/**
 * Read a bucket's `date_start` as the wall clock it names.
 *
 * Bucket stamps name site-local wall time; the chart library labels the axis
 * through the browser's timezone, so honouring an offset would shift labels by
 * the viewer's own offset. The resulting instant is a wall clock only — read it
 * back with `fromChartDate` before formatting, which resolves the site's timezone.
 *
 * @param dateStart - The bucket's `date_start`.
 * @return The bucket's wall clock as a local instant.
 */
export function toChartDate( dateStart: string ): Date {
	// The passthrough (`getRowIntervalFields`) can still carry a nominal offset that
	// normalized stamps lack — stripped here, since that's Stats-only knowledge.
	return parseAsLocalDate( dateStart.replace( nominalOffset, '' ).trim() );
}

/**
 * Re-anchor a chart point's wall clock in the site's timezone — the inverse of
 * `toChartDate`. Every label derived from a chart point (tooltip date, legend
 * range) must go through here first, or it reads out shifted by the viewer's own timezone offset.
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
