/**
 * External dependencies
 */
import { resolveIntervalForRange, type ReportParams } from '@jetpack-premium-analytics/data';
import { PRESET_ALL_TIME, computePrimaryRange } from '@jetpack-premium-analytics/datetime';
import { encodeDateToSearchParam } from '@jetpack-premium-analytics/routing';
/**
 * WordPress dependencies
 */
import { useMemo } from '@wordpress/element';

/**
 * The window the email tabs report over, and the report params that carry it
 * to their widgets.
 */
export type EmailTabScope = {
	/** The send's lifetime: the publish day through today. */
	range: { from: Date; to: Date };
	/** The same window as widget report params, replacing the URL's. */
	reportParams: ReportParams;
};

/**
 * Pin the email tabs to the send's lifetime.
 *
 * An email goes out once and collects nearly all of its opens within a day or
 * two, so the page's rolling presets ("last 7 days") would show a send from
 * months ago as an empty tail. The email tabs therefore report over the
 * all-time window instead — the same span the Post traffic tab's All time pill
 * resolves — and hand it to their widgets as report params, which `WidgetRoot`
 * reads in place of the URL. The URL keeps the Post traffic tab's selection
 * untouched for when the reader tabs back.
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

		const range = computePrimaryRange( PRESET_ALL_TIME, timeZone, { startDate: allTimeStart } );
		const from = encodeDateToSearchParam( range?.from, timeZone );
		const to = encodeDateToSearchParam( range?.to, timeZone );

		if ( ! range || ! from || ! to ) {
			return undefined;
		}

		return {
			range,
			reportParams: {
				post_id: postId,
				preset: PRESET_ALL_TIME,
				from,
				to,
				interval: resolveIntervalForRange( PRESET_ALL_TIME, from, to ),
			},
		};
	}, [ postId, allTimeStart, timeZone ] );
}
