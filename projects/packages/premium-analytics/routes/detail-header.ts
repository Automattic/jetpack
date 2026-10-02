/**
 * External dependencies
 */
import { __, sprintf } from '@wordpress/i18n';
import { parseSiteDateTime, type DateRange } from '@jetpack-premium-analytics/datetime';
import { formatDate } from '@jetpack-premium-analytics/formatters';

/**
 * Formats a resource's publish date for the header, in the site timezone —
 * the one the Stats data below reports in, so the sentence and the date pills
 * agree on the day for every visitor.
 *
 * @param publishedDate - The publish date as the summary carries it.
 * @return The formatted date, or undefined when there is none to format.
 */
export function formatPublishedDate( publishedDate: string | undefined ): string | undefined {
	const parsed = parseSiteDateTime( publishedDate );

	return parsed ? formatDate( parsed, 'compact' ) : undefined;
}

/**
 * States the window every widget below the header reflects.
 *
 * @param range - The committed report date range. Both bounds render in the
 *              reporting timezone, so a browser-local `Date` names the previous
 *              day west of the site.
 * @return The sentence, or undefined when either bound is missing or unparseable.
 */
export function performanceSentence( range: DateRange | undefined ): string | undefined {
	// Doubles as the validity check: an unparseable bound would otherwise reach
	// `formatDate` and render as "Invalid date".
	const from = parseSiteDateTime( range?.from );
	const to = parseSiteDateTime( range?.to );

	if ( ! from || ! to ) {
		return undefined;
	}

	return sprintf(
		/* translators: %1$s and %2$s: the report range bounds, e.g. "Jul 9, 2026". */
		__( 'Performance from %1$s to %2$s', 'jetpack-premium-analytics-pkg' ),
		formatDate( from, 'compact' ),
		formatDate( to, 'compact' )
	);
}
