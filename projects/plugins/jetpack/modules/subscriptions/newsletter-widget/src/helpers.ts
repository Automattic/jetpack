import analytics from '@automattic/jetpack-analytics';
import { getRedirectUrl } from '@automattic/jetpack-components';
import { dateI18n } from '@wordpress/date';
import { SubscriberTotalsByDate, ChartSubscriptionDataPoint } from './types';

/**
 * Creates an event handler function for tracking user interactions
 *
 * @param tracks          - The tracks analytics object
 * @param eventName       - The "action" part of the event name. Will be appended to "jetpack_newsletter_widget_"
 * @param eventProperties - Additional properties to include in the event
 * @returns A callback function that records the event when triggered. To primarily be used as an onClick prop.
 *
 * @example
 * const handleClick = createTracksEventHandler( tracks, 'learn_more_click', { locale: 'en' } );
 */
export const createTracksEventHandler = (
	tracks: typeof analytics.tracks,

	eventAction: string,

	eventProperties: Record< string, unknown > = {}
) => {
	return () => {
		tracks.recordEvent( `jetpack_newsletter_widget_${ eventAction }`, eventProperties );
	};
};

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
 * Generates the URL for subscriber statistics based on site context.
 *
 * @param {string}  site        - The site identifier
 * @param {boolean} isWpcomSite - Whether the site is on WordPress.com
 * @param {string}  adminUrl    - The admin URL for self-hosted sites
 * @returns {string} The appropriate subscriber stats URL
 */
export const getSubscriberStatsUrl = (
	site: string,
	isWpcomSite: boolean,
	adminUrl: string
): string => {
	return isWpcomSite
		? getRedirectUrl( buildJPRedirectSource( `stats/subscribers/${ site }` ) )
		: `${ adminUrl }admin.php?page=stats#!/stats/subscribers/${ site }`;
};

/**
 * Generates the URL for newsletter settings based on site context.
 *
 * @param {string}  site        - The site identifier
 * @param {boolean} isWpcomSite - Whether the site is on WordPress.com
 * @param {string}  adminUrl    - The admin URL for self-hosted sites
 * @returns {string} The appropriate newsletter settings URL
 */
export const getNewsletterSettingsUrl = (
	site: string,
	isWpcomSite: boolean,
	adminUrl: string
): string => {
	return isWpcomSite
		? getRedirectUrl( buildJPRedirectSource( 'settings/newsletter/' + site ) )
		: `${ adminUrl }admin.php?page=jetpack#newsletter`;
};

/**
 * Formats a number into a localized string representation.
 *
 * @param {number} num - The number to format.
 * @returns {string} The formatted number string.
 */
export const formatNumber = ( num: number ): string => {
	return num.toLocaleString();
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
 * Assumes the data is sorted by date, earliest is first.
 *
 * @param {ChartSubscriptionDataPoint[]} data - The subscription data array.
 * @returns {Date[]} An array of dates representing tick positions at 0%, 25%, 50%, 75%, and 100% of the time range.
 */
export const getXAxisTickValues = ( data: ChartSubscriptionDataPoint[] ) => {
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
 * Transforms daily subscription counts into a format for the visx chart package.
 *
 * @param {Record<string, DailySubscriptionStat>} countsByDay - Object mapping date strings to daily subscription counts.
 * @returns {ChartSubscriptionDataPoint[]} An array of subscription statistics.
 */
export const transformData = (
	countsByDay: SubscriberTotalsByDate
): ChartSubscriptionDataPoint[] => {
	return Object.entries( countsByDay )
		.map( ( [ dateStr, counts ] ) => {
			const date = new Date( dateStr );

			if ( isNaN( date.getTime() ) ) {
				return null;
			}

			return {
				date,
				all: counts?.all ?? 0,
				paid: counts?.paid ?? 0,
			};
		} )
		.filter( Boolean )
		.sort( ( a, b ) => a.date.getTime() - b.date.getTime() );
};

/**
 * Calculates the maximum value of the subscription statistics to determine the left axis tick label margin.
 * Larger labels will get cut off so we must dynamically increase the margin based on how many digits are in the largest number.
 *
 * @param {ChartSubscriptionDataPoint[]} subs - The subscription statistics array. The same data used to render the chart.
 * @returns {number} The calculated left axis margin.
 */
export const calcLeftAxisMargin = ( subs: ChartSubscriptionDataPoint[] ): number => {
	const DEFAULT_MARGIN = 30;
	const CHAR_PX_WIDTH = 8;
	const PADDING = 10;

	if ( subs.length === 0 ) {
		return DEFAULT_MARGIN;
	}

	const maxValue = Math.max( ...subs.map( d => Math.max( d.all || 0, d.paid || 0 ) ) );
	// Estimate character width (in pixels) and calculate margin
	// Each digit is roughly 8px, plus add some padding
	const digitCount = maxValue.toString().length;
	return Math.max( DEFAULT_MARGIN, digitCount * CHAR_PX_WIDTH + PADDING );
};
