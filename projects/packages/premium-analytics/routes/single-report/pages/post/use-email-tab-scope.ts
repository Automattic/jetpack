/**
 * External dependencies
 */
import {
	emailSendWindowRange,
	readEmailSendWindow,
	type ReportParams,
	useSiteDay,
} from '@jetpack-premium-analytics/data';
import {
	PRESET_ALL_TIME,
	computePrimaryRange,
	type DateRange,
} from '@jetpack-premium-analytics/datetime';
import { encodeDateToSearchParam } from '@jetpack-premium-analytics/routing';
import { useMemo } from '@wordpress/element';
import type { SectionWidget } from '../adapter';

/**
 * The window the email tabs report over, and the report params that carry it
 * to their widgets.
 */
export type EmailTabScope = {
	/** The send window: the publish day through day 30, or today if sooner. */
	range: Required< DateRange >;
	/** The same window as widget report params, replacing the URL's, plus the send instant. */
	reportParams: ReportParams & { sent_at?: string };
	/** The window the email chart in a layout draws: the one its own control saved, or the default. */
	headerRange: ( layout: readonly SectionWidget[] ) => DateRange | undefined;
};

const EMAIL_CHART_TYPE = 'jpa/email-time-series';

/**
 * The window the layout's email chart reaches over.
 *
 * @param layout   - The section's widgets.
 * @param day      - The start of the send day.
 * @param sentAt   - The send instant.
 * @param timeZone - The site timezone.
 * @return The chart's window, or undefined without a readable send day.
 */
function emailChartRange(
	layout: readonly SectionWidget[],
	day: Date,
	sentAt: Date,
	timeZone: string
): DateRange | undefined {
	const chart = layout.find( widget => widget.type.startsWith( EMAIL_CHART_TYPE ) );
	const window = ( chart?.attributes as { sendWindow?: unknown } | undefined )?.sendWindow;

	return emailSendWindowRange( readEmailSendWindow( window ), { day, sentAt }, timeZone );
}

/**
 * Pin the email tabs to the first 30 days after the send.
 *
 * An email goes out once and collects nearly all of its opens within the
 * first days, so the page's rolling presets ("last 7 days") would show a send
 * from months ago as an empty tail. The email tabs therefore report over a
 * window anchored at the publish day — the chart's default one, or
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

		const window = emailSendWindowRange(
			readEmailSendWindow( undefined ),
			{ day: lifetime.from },
			timeZone
		);
		if ( ! window ) {
			return undefined;
		}

		const range = { from: window.from, to: window.to };
		const from = encodeDateToSearchParam( range.from );
		const to = encodeDateToSearchParam( range.to );

		if ( ! from || ! to ) {
			return undefined;
		}

		return {
			range,
			headerRange: layout => emailChartRange( layout, range.from, allTimeStart, timeZone ),
			reportParams: {
				post_id: postId,
				from,
				to,
				// The email chart counts its first 24 hours from here.
				sent_at: encodeDateToSearchParam( allTimeStart ),
				// A fixed bucket in place of the URL's: the chart's own control settles the one it draws.
				interval: 'day',
			},
		};
	}, [ postId, allTimeStart, timeZone, siteDay ] );
}
