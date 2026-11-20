/**
 * External dependencies
 */
import { format } from 'date-fns';
/**
 * Internal dependencies
 */
import { reportingTimeZone } from './reporting-time-zone';
import { toLocalTZ } from './tz';

const HOUR_MS = 60 * 60 * 1000;

/**
 * Whether the clock shows the hour `date` falls in twice, as it does when it falls back.
 *
 * @param date - Any instant in the hour, on either pass through it.
 * @param zone - The zone whose clock is read, the reporting timezone when omitted.
 * @return True when the hour repeats.
 */
export function isRepeatedHour( date: Date, zone: string = reportingTimeZone() ): boolean {
	const wallHour = ( shift: number ) =>
		format( toLocalTZ( date.getTime() + shift, zone ), 'yyyy-MM-dd HH' );
	const hour = wallHour( 0 );

	return wallHour( -HOUR_MS ) === hour || wallHour( HOUR_MS ) === hour;
}
