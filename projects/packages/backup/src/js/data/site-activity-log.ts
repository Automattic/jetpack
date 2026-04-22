/* eslint-disable jsdoc/require-param-description, jsdoc/require-returns */

import { dateI18n } from '@wordpress/date';

/**
 * Build a full-day [after, before] time range string pair in the site's
 * local timezone, suitable for filtering the WPCOM activity log.
 *
 * Ported from `client/dashboard/utils/site-activity-log.ts` (wp-calypso).
 * @param start
 * @param end
 * @param timezoneString
 * @param gmtOffset
 */
export function buildTimeRangeForActivityLog(
	start: Date,
	end: Date,
	timezoneString?: string,
	gmtOffset?: number
): { after: string; before: string } {
	const timezoneParam = timezoneString || ( typeof gmtOffset === 'number' ? gmtOffset : undefined );
	const startYmd = dateI18n( 'Y-m-d', start, timezoneParam );
	const endYmd = dateI18n( 'Y-m-d', end, timezoneParam );

	return {
		after: `${ startYmd } 00:00:00`,
		before: `${ endYmd } 23:59:59`,
	};
}
