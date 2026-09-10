/**
 * The span of calendar days a stats chart bar stands for.
 *
 * Clicking a "Weeks" bar should open that whole week, not just its first day —
 * the Stats link this replaces ignored the tab and always deep-linked one day.
 *
 * Bar dates arrive as calendar days encoded as UTC midnight (see `statsChart`),
 * so every boundary here is computed and read in UTC; reading local components
 * would shift the day west of UTC.
 *
 * @param {string} isoDate - The bar's date, as a UTC-midnight ISO string.
 * @param {string} unit    - The active chart tab: 'day', 'week', or 'month'.
 *
 * @return {?{from: string, to: string}} The inclusive range as `YYYY-MM-DD` days, or undefined for an unusable date.
 */
export function chartBarRange( isoDate, unit ) {
	const parsed = new Date( isoDate );
	if ( isNaN( parsed.getTime() ) ) {
		return undefined;
	}

	const year = parsed.getUTCFullYear();
	const month = parsed.getUTCMonth();
	const day = parsed.getUTCDate();

	let from;
	let to;

	if ( 'week' === unit ) {
		from = new Date( Date.UTC( year, month, day ) );
		to = new Date( Date.UTC( year, month, day + 6 ) );
	} else if ( 'month' === unit ) {
		from = new Date( Date.UTC( year, month, 1 ) );
		// Day zero of the next month is the last day of this one.
		to = new Date( Date.UTC( year, month + 1, 0 ) );
	} else {
		from = new Date( Date.UTC( year, month, day ) );
		to = from;
	}

	return { from: toCalendarDay( from ), to: toCalendarDay( to ) };
}

/**
 * Renders a UTC instant as its calendar day.
 *
 * @param {Date} date - The date to render.
 * @return {string} The `YYYY-MM-DD` calendar day.
 */
function toCalendarDay( date ) {
	return date.toISOString().slice( 0, 10 );
}
