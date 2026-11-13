/**
 * External dependencies
 */
import { type ReportParams, useSiteDay } from '@jetpack-premium-analytics/data';
import {
	PRESET_ALL_TIME,
	computePrimaryRange,
	endOfDayTZ,
	toLocalTZ,
	type DateRange,
	type IntervalType,
	type TZDate,
} from '@jetpack-premium-analytics/datetime';
import { encodeDateToSearchParam } from '@jetpack-premium-analytics/routing';
import { useMemo } from '@wordpress/element';
import { addDays, addMonths, endOfMonth } from 'date-fns';

/**
 * The windows the email tabs can report over, each anchored at the send: the
 * send day by the hour, the first week and the first 30 days by the day, and
 * the whole lifetime by the month. The values are what the URL carries.
 */
export const EMAIL_SEND_WINDOWS = [
	'send-day',
	'first-week',
	'first-30-days',
	'all-time',
] as const;

export type EmailSendWindow = ( typeof EMAIL_SEND_WINDOWS )[ number ];

/**
 * The window the email tabs open on: what the legacy Stats email page showed.
 */
export const DEFAULT_EMAIL_SEND_WINDOW: EmailSendWindow = 'first-30-days';

/**
 * How many days after the send the first-30-days window covers, the send day
 * included. Matches the per-post email timeline endpoint's cap of 30 daily
 * buckets per request, and the window the legacy Stats email page shows.
 */
export const EMAIL_SEND_WINDOW_DAYS = 30;

/**
 * How many months the all-time window can cover: the timeline endpoint answers
 * at most 30 buckets per request, whatever their size.
 */
export const EMAIL_SEND_WINDOW_MONTHS = 30;

/**
 * Whether a URL value names one of the email windows.
 *
 * @param value - The value the URL carries.
 * @return Whether it is a window.
 */
export function isEmailSendWindow( value: unknown ): value is EmailSendWindow {
	return typeof value === 'string' && ( EMAIL_SEND_WINDOWS as readonly string[] ).includes( value );
}

/**
 * The window the email tabs report over, and the report params that carry it
 * to their widgets.
 */
export type EmailTabScope = {
	/** The chosen window. */
	window: EmailSendWindow;
	/** The window as dates: the publish day through its end, or today if sooner. */
	range: Required< DateRange >;
	/** The same window as widget report params, replacing the URL's. */
	reportParams: ReportParams;
	/** Whether the send is older than the all-time window can reach, whichever window is chosen. */
	isLifetimeCapped: boolean;
};

/**
 * Where a window ends, counted from the send day, and the bucket it is drawn in.
 *
 * @param window   - The window.
 * @param from     - The start of the send day.
 * @param timeZone - The site timezone.
 * @return The last instant of the window and the bucket size.
 */
function resolveWindowEnd(
	window: EmailSendWindow,
	from: Date,
	timeZone: string
): { windowEnd: TZDate; interval: IntervalType } {
	switch ( window ) {
		case 'send-day':
			return { windowEnd: endOfDayTZ( from, timeZone ), interval: 'hour' };
		case 'first-week':
			return { windowEnd: endOfDayTZ( addDays( from, 6 ), timeZone ), interval: 'day' };
		case 'all-time': {
			// The cap counts calendar months, as the endpoint buckets them: a
			// mid-month send takes its month as the first of the 30.
			const lastMonth = addMonths( toLocalTZ( from, timeZone ), EMAIL_SEND_WINDOW_MONTHS - 1 );

			return { windowEnd: endOfDayTZ( endOfMonth( lastMonth ), timeZone ), interval: 'month' };
		}
		case 'first-30-days':
		default:
			return {
				windowEnd: endOfDayTZ( addDays( from, EMAIL_SEND_WINDOW_DAYS - 1 ), timeZone ),
				interval: 'day',
			};
	}
}

/**
 * Pin the email tabs to a window after the send.
 *
 * An email goes out once and collects nearly all of its opens within the
 * first days, so the page's rolling presets ("last 7 days") would show a send
 * from months ago as an empty tail. The email tabs therefore report over a
 * window anchored at the publish day — the send day by the hour, the first
 * week or 30 days by the day, or the lifetime by the month, each through today
 * for a younger send — and hand it to their widgets as report params, which
 * `WidgetRoot` reads in place of the URL. The URL keeps the Post traffic tab's
 * selection untouched for when the reader tabs back.
 *
 * Every window fits the timeline endpoint's cap of 30 buckets per request:
 * the send day is 24 hourly buckets, the daily windows at most 30, and the
 * lifetime stops at 30 months, `isLifetimeCapped` then flagging the cut. The counts,
 * rates and breakdowns on the same tabs are all-time regardless.
 *
 * Undefined until the publish date is known: the timeline query needs a start
 * date, so the widgets wait rather than draw the URL's window first.
 *
 * @param postId       - The scoped post ID.
 * @param allTimeStart - The publish day in the site timezone, once the summary has it.
 * @param timeZone     - The site timezone.
 * @param window       - The window to report over.
 * @return The pinned scope, or undefined while the start is unknown.
 */
export function useEmailTabScope(
	postId: number,
	allTimeStart: Date | undefined,
	timeZone: string,
	window: EmailSendWindow = DEFAULT_EMAIL_SEND_WINDOW
): EmailTabScope | undefined {
	const siteDay = useSiteDay();

	return useMemo( () => {
		void siteDay;
		if ( ! allTimeStart || ! ( postId > 0 ) ) {
			return undefined;
		}

		// The all-time range runs from the publish day through today; the
		// window keeps its start and caps its end.
		const lifetime = computePrimaryRange( PRESET_ALL_TIME, timeZone, { startDate: allTimeStart } );
		if ( ! lifetime ) {
			return undefined;
		}

		const { windowEnd, interval } = resolveWindowEnd( window, lifetime.from, timeZone );
		const endsEarly = windowEnd < lifetime.to;
		const range = {
			from: lifetime.from,
			to: endsEarly ? windowEnd : lifetime.to,
		};
		const from = encodeDateToSearchParam( range.from );
		const to = encodeDateToSearchParam( range.to );

		if ( ! from || ! to ) {
			return undefined;
		}

		// A send from today has one day to show, which only hours draw as a series.
		const isSendDay = range.to <= endOfDayTZ( range.from, timeZone );

		return {
			window,
			range,
			reportParams: { post_id: postId, from, to, interval: isSendDay ? 'hour' : interval },
			isLifetimeCapped:
				resolveWindowEnd( 'all-time', lifetime.from, timeZone ).windowEnd < lifetime.to,
		};
	}, [ postId, allTimeStart, timeZone, window, siteDay ] );
}
