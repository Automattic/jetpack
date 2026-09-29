/**
 * External dependencies
 */
import { toLocalTZ } from '@jetpack-premium-analytics/datetime';
import { format } from 'date-fns';

// Matches the 30-minute polling of Stats v1.
export const DEFAULT_REFETCH_INTERVAL = 30 * 60 * 1000;

/**
 * Refetch interval for a Stats window: none once it ended before today in the
 * report timezone, since a finished window cannot change.
 *
 * @param endDate  - The window's end date, when the request has one.
 * @param timezone - The report timezone.
 * @param now      - The instant to read "today" from.
 * @return The interval in milliseconds, or `false` to stop polling.
 */
export function getStatsRefetchInterval(
	endDate: unknown,
	timezone: string,
	now: Date = new Date()
): number | false {
	if ( typeof endDate !== 'string' ) {
		return DEFAULT_REFETCH_INTERVAL;
	}

	const end = toLocalTZ( endDate, timezone );

	// Unreadable is treated as current: a missed poll is worse than a spare one.
	if ( Number.isNaN( end.getTime() ) ) {
		return DEFAULT_REFETCH_INTERVAL;
	}

	const today = format( toLocalTZ( now, timezone ), 'yyyy-MM-dd' );

	return format( end, 'yyyy-MM-dd' ) < today ? false : DEFAULT_REFETCH_INTERVAL;
}
