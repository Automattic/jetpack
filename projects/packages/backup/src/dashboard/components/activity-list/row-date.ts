import { date, dateI18n } from '@wordpress/date';
import { __, sprintf } from '@wordpress/i18n';

const ABSOLUTE_FORMAT = 'M j, Y, g:i A';

/**
 * The site-timezone calendar day before the given `Y-m-d` day.
 *
 * Steps the calendar and not the clock, so a 23- or 25-hour DST day cannot skip or repeat a day.
 *
 * @param day - A `Y-m-d` string.
 * @return The previous day as `Y-m-d`.
 */
function previousDay( day: string ): string {
	const [ year, month, dayOfMonth ] = day.split( '-' ).map( Number );
	return new Date( Date.UTC( year, month - 1, dayOfMonth - 1 ) ).toISOString().slice( 0, 10 );
}

/**
 * A row's timestamp: "Today, 7:00 AM" or "Yesterday, 7:00 AM" in the site timezone, else absolute.
 *
 * @param publishedAt - The row's ISO timestamp.
 * @param now         - The reference instant; injectable for tests.
 * @return The formatted date.
 */
export function formatRowDate( publishedAt: string, now: Date = new Date() ): string {
	const day = dateI18n( 'Y-m-d', publishedAt, undefined );
	const today = date( 'Y-m-d', now );
	const time = dateI18n( 'g:i A', publishedAt, undefined );

	if ( day === today ) {
		/* translators: %s: time of day, such as 7:00 AM. */
		return sprintf( __( 'Today, %s', 'jetpack-backup-pkg' ), time );
	}
	if ( day === previousDay( today ) ) {
		/* translators: %s: time of day, such as 7:00 AM. */
		return sprintf( __( 'Yesterday, %s', 'jetpack-backup-pkg' ), time );
	}
	return dateI18n( ABSOLUTE_FORMAT, publishedAt, undefined );
}
