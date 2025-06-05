import { getStringWidth } from '@visx/text';
import type { TickFormatter } from '@visx/axis';
import type { AnyD3Scale, ScaleInput } from '@visx/scale';

/**
 * Returns the width of the longest tick.
 *
 * @param          ticks      - Ticks to get the width of.
 * @param          formatTick - Function to format the tick.
 * @param {object} labelStyle - Style object for the label.
 * @return {number} - Width of the longest tick.
 */
export const getLongestTickWidth = < T extends AnyD3Scale >(
	ticks: ScaleInput< T >[],
	formatTick: TickFormatter< ScaleInput< T > >,
	labelStyle?: object
) => {
	const formattedTicks = ticks.map( tick => formatTick( tick, 0, [] ) );
	const longestTick = formattedTicks.reduce(
		( longest, current ) => ( longest.length >= current.length ? longest : current ),
		formattedTicks[ 0 ]
	);

	return getStringWidth( longestTick, labelStyle );
};

/**
 * Parse a date string into a Date object in the timezone of browser.
 * @param {string|number} dateString - YYYY-MM-DD format or a timestamp
 * @return {Date} A Date object in the timezone of the browser.
 */
export const parseLocalDate = dateString => {
	let validDateString = dateString;

	const dateStringSplits = dateString.split( ' ' );
	// For date strings like '2025-01-01 01:00:00'.
	if ( dateStringSplits.length === 2 ) {
		validDateString = `${ dateStringSplits[ 0 ] }T${ dateStringSplits[ 1 ] }Z`;
	} else if ( dateStringSplits.length === 1 ) {
		validDateString = `${ dateStringSplits[ 0 ] }T00:00:00Z`;
	}

	// Compatible with Date object.
	const date = new Date( validDateString );
	if ( isNaN( date.getTime() ) ) {
		return date;
	}

	// Adjust the date to the timezone of the browser.
	date.setMinutes( date.getMinutes() + date.getTimezoneOffset() );

	return date;
};
