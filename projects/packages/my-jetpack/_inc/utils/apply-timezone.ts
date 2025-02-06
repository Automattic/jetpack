import { getDate } from '@wordpress/date';

/**
 * Applies local timezone to date (via timezone offset)
 * @param {string} date   - a date string with format like: 2024-12-08T14:41:45.170+00:00
 * @param {number} offset - the timezone offset in hours, like: -3
 *
 * @return {Date} a JavaScript Date object
 */
export function applyTimezone( date: string, offset: number ): Date {
	const dateObject = getDate( date );
	dateObject.setHours( dateObject.getHours() + offset );

	return dateObject;
}
