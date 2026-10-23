import { parseSiteDateTime, type DateRange } from '@jetpack-premium-analytics/datetime';
import { formatDate } from '@jetpack-premium-analytics/formatters';
import { __, sprintf } from '@wordpress/i18n';

/**
 * The entity's publication date as the header prints it, or undefined when unparseable.
 *
 * @param publishedDate - The date the entity was published, as the report returns it.
 */
export function formatPublishedDate( publishedDate: string | undefined ): string | undefined {
	const parsed = parseSiteDateTime( publishedDate );
	return parsed ? formatDate( parsed, 'compact' ) : undefined;
}

/**
 * The "Performance from … to …" sentence for the applied range, or undefined without one.
 *
 * @param range - The applied report range.
 */
export function performanceSentence( range: DateRange | undefined ): string | undefined {
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
