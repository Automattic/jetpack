/**
 * External dependencies
 */
import {
	dateToISOStringWithLocalTZ,
	endOfDayTZ,
	type TZDate,
	toLocalTZ,
} from '@jetpack-premium-analytics/datetime';
import { addDays, addHours, addMonths, endOfMonth, startOfHour } from 'date-fns';

/**
 * The windows an email's timeline can be read over, each counted from the send.
 * The values are what a widget saves.
 */
export const EMAIL_SEND_WINDOWS = [
	'first-24-hours',
	'first-week',
	'first-30-days',
	'all-time',
] as const;

export type EmailSendWindow = ( typeof EMAIL_SEND_WINDOWS )[ number ];

/** The window read when none is saved: what the legacy Stats email page showed. */
export const DEFAULT_EMAIL_SEND_WINDOW: EmailSendWindow = 'first-30-days';

// The timeline endpoint answers at most 30 daily or monthly buckets per request.
const EMAIL_SEND_WINDOW_DAYS = 30;
const EMAIL_SEND_WINDOW_MONTHS = 30;

/** When an email went out: its day, and the instant itself where the host knows it. */
export type EmailSend = {
	/** The start of the send day. */
	day: unknown;
	/** The send instant; without it the first 24 hours start at the send day's midnight. */
	sentAt?: unknown;
};

type EmailSendWindowRange = {
	from: TZDate;
	to: TZDate;
	interval: 'hour' | 'day' | 'month';
};

/**
 * Whether a saved value names one of the windows.
 *
 * @param value - The saved value.
 * @return Whether it is a window.
 */
export function isEmailSendWindow( value: unknown ): value is EmailSendWindow {
	return typeof value === 'string' && ( EMAIL_SEND_WINDOWS as readonly string[] ).includes( value );
}

/**
 * Read a host-supplied date in the site timezone.
 *
 * @param value    - A date, or a string naming one.
 * @param timeZone - The site timezone.
 * @return The date, or undefined when the value names none.
 */
function readDate( value: unknown, timeZone: string ): TZDate | undefined {
	const isReadable = typeof value === 'string' || value instanceof Date;

	return isReadable && ! Number.isNaN( new Date( value ).getTime() )
		? toLocalTZ( new Date( value ), timeZone )
		: undefined;
}

/**
 * A window as dates and the bucket it is drawn in, through today for a send younger than it.
 *
 * @param window   - The window.
 * @param send     - When the email went out.
 * @param timeZone - The site timezone.
 * @param now      - The current instant.
 * @return The window, or undefined without a readable send day.
 */
export function emailSendWindowRange(
	window: EmailSendWindow,
	send: EmailSend,
	timeZone: string,
	now: Date = new Date()
): EmailSendWindowRange | undefined {
	const day = readDate( send.day, timeZone );
	if ( ! day ) {
		return undefined;
	}

	let from = day;
	let end: TZDate;
	let interval: EmailSendWindowRange[ 'interval' ] = 'day';

	switch ( window ) {
		case 'first-24-hours': {
			// Hourly buckets are whole clock hours, so the 24 start with the hour of the send.
			from = startOfHour( readDate( send.sentAt, timeZone ) ?? day );
			end = toLocalTZ( addHours( from, 24 ).getTime() - 1, timeZone );
			interval = 'hour';
			break;
		}
		case 'first-week':
			end = endOfDayTZ( addDays( day, 6 ), timeZone );
			break;
		case 'all-time': {
			// Calendar months, as the endpoint buckets them: a mid-month send takes its month as the first.
			end = endOfDayTZ( endOfMonth( addMonths( day, EMAIL_SEND_WINDOW_MONTHS - 1 ) ), timeZone );
			interval = 'month';
			break;
		}
		case 'first-30-days':
		default:
			end = endOfDayTZ( addDays( day, EMAIL_SEND_WINDOW_DAYS - 1 ), timeZone );
	}

	const today = endOfDayTZ( now, timeZone );

	return { from, to: end < today ? end : today, interval };
}

/**
 * The same window as the `from`/`to`/`interval` report params a timeline query takes.
 *
 * @param window   - The window.
 * @param send     - When the email went out.
 * @param timeZone - The site timezone.
 * @param now      - The current instant.
 * @return The report params, or undefined without a readable send day.
 */
export function emailSendWindowParams(
	window: EmailSendWindow,
	send: EmailSend,
	timeZone: string,
	now: Date = new Date()
): { from: string; to: string; interval: EmailSendWindowRange[ 'interval' ] } | undefined {
	const range = emailSendWindowRange( window, send, timeZone, now );

	return (
		range && {
			from: dateToISOStringWithLocalTZ( range.from ),
			to: dateToISOStringWithLocalTZ( range.to ),
			interval: range.interval,
		}
	);
}
