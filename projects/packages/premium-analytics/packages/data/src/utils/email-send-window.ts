/**
 * External dependencies
 */
import {
	dateToISOStringWithLocalTZ,
	endOfDayTZ,
	type DateRange,
	type TZDate,
	toLocalTZ,
} from '@jetpack-premium-analytics/datetime';
import { addDays, addMonths, endOfMonth } from 'date-fns';

/** The buckets an email's timeline is read in, each with its own reach past the send. */
export type EmailSendWindowInterval = 'hour' | 'day' | 'month';

/**
 * How far each interval reaches, the send's own day or month included. The
 * timeline endpoint answers at most 30 buckets per request, whatever their size.
 */
const EMAIL_SEND_WINDOW_DAYS = 30;
const EMAIL_SEND_WINDOW_MONTHS = 30;

/**
 * Where an interval's window ends, counted from the send day.
 *
 * @param interval - The bucket the chart draws.
 * @param from     - The start of the send day.
 * @param timeZone - The site timezone.
 * @return The last instant of the window.
 */
function sendWindowEnd( interval: EmailSendWindowInterval, from: Date, timeZone: string ): TZDate {
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
 * @param sentAt   - The start of the send day.
 * @param timeZone - The site timezone.
 * @param now      - The current instant.
 * @return The window, or undefined without a readable send day.
 */
export function emailSendWindowRange(
	interval: EmailSendWindowInterval,
	sentAt: unknown,
	timeZone: string,
	now: Date = new Date()
): Required< DateRange > | undefined {
	const isReadable = typeof sentAt === 'string' || sentAt instanceof Date;
	if ( ! isReadable || Number.isNaN( new Date( sentAt ).getTime() ) ) {
		return undefined;
	}

	const from = toLocalTZ( new Date( sentAt ), timeZone );

	const end = sendWindowEnd( interval, from, timeZone );
	const today = endOfDayTZ( now, timeZone );

	return { from, to: end < today ? end : today };
}

/**
 * The same window as the `from`/`to`/`interval` report params a timeline query takes.
 *
 * @param interval - The bucket the chart draws.
 * @param sentAt   - The start of the send day, as the host's report params carry it.
 * @param timeZone - The site timezone.
 * @param now      - The current instant.
 * @return The report params, or undefined without a readable send day.
 */
export function emailSendWindowParams(
	interval: EmailSendWindowInterval,
	sentAt: unknown,
	timeZone: string,
	now: Date = new Date()
): { from: string; to: string; interval: EmailSendWindowInterval } | undefined {
	const range = emailSendWindowRange( interval, sentAt, timeZone, now );

	return (
		range && {
			from: dateToISOStringWithLocalTZ( range.from ),
			to: dateToISOStringWithLocalTZ( range.to ),
			interval,
		}
	);
}
