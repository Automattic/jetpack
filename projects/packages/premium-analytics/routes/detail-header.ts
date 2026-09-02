/**
 * External dependencies
 */
import { __, sprintf } from '@wordpress/i18n';
import { format, isValid } from 'date-fns';
import {
	parseSiteDateTime,
	siteTimeZone,
	toLocalTZ,
	type DateRange,
} from '@jetpack-premium-analytics/datetime';
import type { SectionHeaderProps } from '@jetpack-premium-analytics/ui';

const DATE_FORMAT = 'MMM d, yyyy';

/** What a detail page hands the shared header, owned by the header's own props. */
export type HeaderSlots = Pick< SectionHeaderProps, 'visual' | 'title' | 'subTitle' | 'busy' >;

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

	return parsed ? format( toLocalTZ( parsed, siteTimeZone() ), DATE_FORMAT ) : undefined;
}

/**
 * States the window every widget below the header reflects.
 *
 * @param range - The committed report date range.
 * @return The sentence, or undefined when either bound is missing or unparseable.
 */
export function performanceSentence( range: DateRange | undefined ): string | undefined {
	const { from, to } = range ?? {};

	if ( ! from || ! to || ! isValid( from ) || ! isValid( to ) ) {
		return undefined;
	}

	return sprintf(
		/* translators: %1$s and %2$s: the report range bounds, e.g. "Jul 9, 2026". */
		__( 'Performance from %1$s to %2$s', 'jetpack-premium-analytics-pkg' ),
		format( from, DATE_FORMAT ),
		format( to, DATE_FORMAT )
	);
}
