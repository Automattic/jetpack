/**
 * External dependencies
 */
import {
	dateToISOStringWithLocalTZ,
	endOfDayTZ,
	toLocalTZ,
} from '@jetpack-premium-analytics/datetime';
import { addDays, addMonths, endOfMonth } from 'date-fns';
/**
 * Internal dependencies
 */
import type { EmailTimeSeriesInterval } from './widget';

/**
 * How far each interval reaches, the send's own day or month included. The
 * timeline endpoint answers at most 30 buckets per request, whatever their size.
 */
export const EMAIL_SEND_WINDOW_DAYS = 30;
export const EMAIL_SEND_WINDOW_MONTHS = 30;

/**
 * Where an interval's window ends, counted from the send day.
 *
 * @param interval - The bucket the chart draws.
 * @param from     - The start of the send day.
 * @param timeZone - The site timezone.
 * @return The last instant of the window.
 */
function sendWindowEnd( interval: EmailTimeSeriesInterval, from: Date, timeZone: string ): Date {
	switch ( interval ) {
		case 'hour':
			return endOfDayTZ( from, timeZone );
		case 'month': {
			// Calendar months, as the endpoint buckets them: a mid-month send takes its month as the first.
			const lastMonth = addMonths( toLocalTZ( from, timeZone ), EMAIL_SEND_WINDOW_MONTHS - 1 );

			return endOfDayTZ( endOfMonth( lastMonth ), timeZone );
		}
		case 'day':
		default:
			return endOfDayTZ(
				addDays( toLocalTZ( from, timeZone ), EMAIL_SEND_WINDOW_DAYS - 1 ),
				timeZone
			);
	}
}

/**
 * The window an interval reports over: from the send through the interval's reach, or today if sooner.
 *
 * @param interval - The bucket the chart draws.
 * @param sentAt   - The start of the send day, as the host's report params carry it.
 * @param timeZone - The site timezone.
 * @param now      - The current instant.
 * @return The `from`/`to`/`interval` report params, or undefined without a readable send day.
 */
export function emailSendWindowParams(
	interval: EmailTimeSeriesInterval,
	sentAt: unknown,
	timeZone: string,
	now: Date = new Date()
): { from: string; to: string; interval: EmailTimeSeriesInterval } | undefined {
	const from = typeof sentAt === 'string' ? new Date( sentAt ) : undefined;
	if ( ! from || Number.isNaN( from.getTime() ) ) {
		return undefined;
	}

	const end = sendWindowEnd( interval, from, timeZone );
	const today = endOfDayTZ( now, timeZone );

	return {
		from: dateToISOStringWithLocalTZ( from ),
		to: dateToISOStringWithLocalTZ( end < today ? end : today ),
		interval,
	};
}
