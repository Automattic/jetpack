/**
 * External dependencies
 */
import { type ReportParams } from '@jetpack-premium-analytics/data';
import {
	PRESET_ALL_TIME,
	computePrimaryRange,
	endOfDayTZ,
	type DateRange,
} from '@jetpack-premium-analytics/datetime';
import { encodeDateToSearchParam } from '@jetpack-premium-analytics/routing';
import { useMemo } from '@wordpress/element';
import { addDays } from 'date-fns';

/**
 * How many days after the send the email tabs' timeline covers, the send day
 * included. Matches the per-post email timeline endpoint's cap of 30 daily
 * buckets per request, and the window the legacy Stats email page shows.
 */
export const EMAIL_SEND_WINDOW_DAYS = 30;

/**
 * The window the email tabs report over, and the report params that carry it
 * to their widgets.
 */
export type EmailTabScope = {
	/** The send window: the publish day through day 30, or today if sooner. */
	range: Required< DateRange >;
	/** The same window as widget report params, replacing the URL's. */
	reportParams: ReportParams;
};

/**
 * Pin the email tabs to the first 30 days after the send.
 *
 * An email goes out once and collects nearly all of its opens within the
 * first days, so the page's rolling presets ("last 7 days") would show a send
 * from months ago as an empty tail. The email tabs therefore report over a
 * window anchored at the publish day — `EMAIL_SEND_WINDOW_DAYS` long, or
 * through today for a younger send — and hand it to their widgets as report
 * params, which `WidgetRoot` reads in place of the URL. The URL keeps the
 * Post traffic tab's selection untouched for when the reader tabs back.
 *
 * The window is bounded rather than the send's whole lifetime because the
 * timeline endpoint returns at most 30 daily buckets per request; the counts,
 * rates and breakdowns on the same tabs are all-time regardless.
 *
 * Undefined until the publish date is known: the timeline query needs a start
 * date, so the widgets wait rather than draw the URL's window first.
 *
 * @param postId       - The scoped post ID.
 * @param allTimeStart - The publish day in the site timezone, once the summary has it.
 * @param timeZone     - The site timezone.
 * @return The pinned scope, or undefined while the start is unknown.
 */
export function useEmailTabScope(
	postId: number,
	allTimeStart: Date | undefined,
	timeZone: string
): EmailTabScope | undefined {
	return useMemo( () => {
		if ( ! allTimeStart || ! ( postId > 0 ) ) {
			return undefined;
		}

		// The all-time range runs from the publish day through today; the
		// window keeps its start and caps its end.
		const lifetime = computePrimaryRange( PRESET_ALL_TIME, timeZone, { startDate: allTimeStart } );
		if ( ! lifetime ) {
			return undefined;
		}

		const windowEnd = endOfDayTZ( addDays( lifetime.from, EMAIL_SEND_WINDOW_DAYS - 1 ), timeZone );
		const range = {
			from: lifetime.from,
			to: windowEnd < lifetime.to ? windowEnd : lifetime.to,
		};
		const from = encodeDateToSearchParam( range.from, timeZone );
		const to = encodeDateToSearchParam( range.to, timeZone );

		if ( ! from || ! to ) {
			return undefined;
		}

		return {
			range,
			reportParams: {
				post_id: postId,
				from,
				to,
				// One bucket per day: the window is at most 30 days, and the
				// endpoint only offers hourly or daily buckets.
				interval: 'day',
			},
		};
	}, [ postId, allTimeStart, timeZone ] );
}
