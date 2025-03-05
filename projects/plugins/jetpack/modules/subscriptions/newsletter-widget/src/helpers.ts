import { dateI18n } from '@wordpress/date';
import { DailyCount, SubscriptionStat } from './types';

/**
 * Helper function to build the Jetpack redirect source URL.
 * @param url         - The url to redirect to. Note: it can only be to a whitelisted domain, and query params and anchors must be passed to getRedirectUrl as arguments.
 * @param isWpcomSite - The the site on the WordPress.com platform. Simple or WoA.
 * @return The URL that can be passed to the getRedirectUrl function.
 * @example
 * const site = 'example.wordpress.com';
 * const redirectUrl = buildJPRedirectSource( `subscribers/${ site }`, true );
 *
 * <a href={ getRedirectUrl( redirectUrl ) }>Subscriber</a>;
 */
export const buildJPRedirectSource = ( url: string, isWpcomSite: boolean = true ) => {
	const host = isWpcomSite ? 'wordpress.com' : 'cloud.jetpack.com';
	return `https://${ host }/${ url }`;
};

/**
 * Formats a date into a string representation.
 *
 * @param {Date}             date   - The date to format.
 * @param {'short' | 'full'} format - Format type: 'short' for "Jan 5" or 'full' for "Jan 5, 2023".
 * @returns {string} The formatted date string.
 */
export const formatDate = ( date: Date, format: 'short' | 'full' = 'short' ) => {
	if ( format === 'short' ) {
		// 'M j' = Short month name followed by day number without leading zeros (e.g., "Jan 5")
		return dateI18n( 'M j', date );
	}

	// 'M j, Y' = Short month name, day number without leading zeros, and year (e.g., "Jan 5, 2023")
	return dateI18n( 'M j, Y', date );
};

/**
 * Formats a date specifically for axis tick labels.
 *
 * @param {Date} date - The date to format.
 * @returns {string} The formatted date string in short format.
 */
export const formatAxisTickDate = ( date: Date ) => formatDate( date, 'short' );

/**
 * Calculates evenly spaced tick values for the X-axis for time series data.
 *
 * @param {SubscriptionStat[]} data - The subscription data array.
 * @returns {Date[]} An array of dates representing tick positions at 0%, 25%, 50%, 75%, and 100% of the time range.
 */
export const getXAxisTickValues = ( data: SubscriptionStat[] ) => {
	if ( data.length < 2 ) return data.map( d => d.date );

	const firstDate = data[ 0 ].date;
	const lastDate = data[ data.length - 1 ].date;

	// Calculate total time span in milliseconds
	const timeSpan = lastDate.getTime() - firstDate.getTime();

	return [
		firstDate,
		new Date( firstDate.getTime() + timeSpan * 0.25 ),
		new Date( firstDate.getTime() + timeSpan * 0.5 ),
		new Date( firstDate.getTime() + timeSpan * 0.75 ),
		lastDate,
	];
};

/**
 * Transforms daily subscription counts into cumulative statistics in a format for the visx chart package.
 *
 * @param {Record<string, DailyCount>} countsByDay - Object mapping date strings to daily subscription counts.
 * @returns {SubscriptionStat[]} An array of subscription statistics with cumulative totals, sorted by date.
 */
export const transformData = ( countsByDay: Record< string, DailyCount > ): SubscriptionStat[] => {
	const entries = Object.entries( countsByDay )
		.map( ( [ dateStr, counts ] ) => ( {
			date: new Date( dateStr ),
			all: counts.all,
			email: counts.email,
			paid: counts.paid,
		} ) )
		.sort( ( a, b ) => a.date.getTime() - b.date.getTime() );

	// Calculate cumulative totals
	let allTotal = 0;
	let emailTotal = 0;
	let paidTotal = 0;

	return entries.map( entry => {
		allTotal += entry.all;
		emailTotal += entry.email;
		paidTotal += entry.paid;

		return {
			date: entry.date,
			all: allTotal,
			email: emailTotal,
			paid: paidTotal,
		};
	} );
};
