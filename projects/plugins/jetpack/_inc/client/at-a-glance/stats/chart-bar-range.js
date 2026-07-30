/**
 * The span of calendar days a stats chart bar stands for.
 *
 * The chart's Days / Weeks / Months tabs each plot bars keyed on the first day
 * of the period, so the bar's own date alone doesn't say how much time it
 * covers. Clicking a "Weeks" bar should open that whole week, not just its
 * Monday — the old Stats link ignored the tab and always deep-linked to a single
 * day, which is part of why it landed somewhere that didn't match the bar.
 *
 * Bar dates arrive from the Stats API as calendar days and are encoded as UTC
 * midnight (see `statsChart`), so every boundary here is computed and read in
 * UTC. Reading local components instead would shift the day for any site west of
 * UTC.
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
 * Render a UTC instant as its `YYYY-MM-DD` calendar day.
 *
 * @param {Date} date - The date to render.
 *
 * @return {string} The calendar day.
 */
function toCalendarDay( date ) {
	return date.toISOString().slice( 0, 10 );
}
