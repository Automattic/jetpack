import { tz, TZDateMini } from '@date-fns/tz';
import { endOfDay, format, startOfDay } from 'date-fns';
import { getAdminUrl, getScriptData } from './utils.ts';
import type {
	AnalyticsDateRange,
	AnalyticsPostSection,
	AnalyticsScriptData,
	AnalyticsView,
} from './types.ts';

/**
 * The timestamp format the analytics dashboard writes date-window params in:
 * an ISO string carrying the site's UTC offset. Matches the dashboard's own
 * `dateToISOStringWithTZ`.
 */
const ISO_WITH_OFFSET = "yyyy-MM-dd'T'HH:mm:ss.SSSxxx";

/**
 * The dashboard's sections, keyed by the neutral section name callers use. The
 * dashboard reads `?section=` as a section *slug* — the segment after the
 * namespace in the server-side registry (`analytics/traffic` is registered,
 * `traffic` is what reaches the URL).
 */
const DASHBOARD_SECTIONS = {
	traffic: 'traffic',
	insights: 'insights',
	subscribers: 'subscribers',
	store: 'store',
} as const;

/**
 * The single-post view's tabs, keyed by the neutral section name. Callers say
 * `traffic`; the tab layout registry calls it `post-traffic`.
 */
const POST_SECTIONS: Record< AnalyticsPostSection, string > = {
	traffic: 'post-traffic',
	'email-opens': 'email-opens',
	'email-clicks': 'email-clicks',
};

/**
 * Reads the `analytics` script data published by the Premium Analytics package.
 *
 * The package only publishes this on sites where it *is* the analytics UI, so
 * its presence is the branch signal.
 *
 * @return The analytics script data, or undefined where it is not the analytics UI.
 */
function getAnalyticsScriptData(): AnalyticsScriptData | undefined {
	const analytics = getScriptData()?.analytics;

	return analytics?.enabled ? analytics : undefined;
}

/**
 * Whether the Premium Analytics dashboard is the analytics UI on this site.
 *
 * Callers that already have a working link to the legacy Stats page use this to
 * decide whether to replace it. It answers a different question from
 * `getAnalyticsUrl()` returning null: false here means "keep your existing
 * link", whereas a null URL means the dashboard is the analytics UI but this
 * user cannot open it, and the control should be hidden — there is no Stats
 * page to fall back to, since it is not registered once the dashboard replaces
 * it.
 *
 * @return Whether to route analytics links to the dashboard.
 */
export function hasAnalyticsDashboard(): boolean {
	return getAnalyticsScriptData() !== undefined;
}

/**
 * Encodes a calendar day as the offset-bearing timestamp the dashboard writes
 * to its own URL. The date picker parses `from`/`to` as instants, so a bare
 * `YYYY-MM-DD` would be read as UTC midnight and land on the previous day for
 * any site west of UTC.
 *
 * `TZDateMini`'s parts constructor reads the given wall clock *in* the target
 * zone, so the offset in the output is the one actually in effect on that day —
 * which differs between the two boundaries across a daylight-saving transition.
 *
 * @param day      - The calendar day, `YYYY-MM-DD` in the site's timezone.
 * @param boundary - Which end of the day to encode.
 * @param timezone - The site timezone, an IANA name or a fixed UTC offset.
 * @return The encoded timestamp, or undefined when the day cannot be encoded.
 */
function encodeDay( day: string, boundary: 'start' | 'end', timezone: string ): string | undefined {
	const parts = /^(\d{4})-(\d{2})-(\d{2})$/.exec( day );
	if ( ! parts ) {
		return undefined;
	}

	const [ , year, month, date ] = parts;

	try {
		const midnight = new TZDateMini(
			Number( year ),
			Number( month ) - 1,
			Number( date ),
			timezone
		);
		const at = boundary === 'start' ? startOfDay( midnight ) : endOfDay( midnight );
		const encoded = format( at, ISO_WITH_OFFSET, { in: tz( timezone ) } );

		return encoded.includes( 'Invalid' ) ? undefined : encoded;
	} catch {
		// An unusable zone name throws a RangeError out of Intl.
		return undefined;
	}
}

/**
 * Builds the `from`/`to` search params for a date range, dropping the range
 * entirely if either boundary cannot be encoded — a half-applied range would
 * silently widen the window the dashboard shows.
 *
 * `interval`, `preset` and the comparison params are deliberately left off: the
 * dashboard's own route seeds an interval valid for the range, and omitting
 * `preset` keeps the range a custom one rather than forcing a comparison the
 * caller never asked for.
 *
 * @param range    - The requested range.
 * @param timezone - The site timezone.
 * @return The search params to merge, empty when the range cannot be encoded.
 */
function rangeParams( range: AnalyticsDateRange, timezone: string ): Record< string, string > {
	const from = encodeDay( range.from, 'start', timezone );
	const to = encodeDay( range.to, 'end', timezone );

	return from && to ? { from, to } : {};
}

/**
 * Builds the internal router path for a view, or undefined when the view has no
 * route.
 *
 * @param view - The requested view.
 * @return The internal path, e.g. `/post/42`.
 */
function analyticsPath( view: AnalyticsView ): string | undefined {
	if ( view.view === 'dashboard' ) {
		return '/';
	}

	return view.id > 0 ? `/post/${ view.id }` : undefined;
}

/**
 * Builds the `?section=` param for a view, translating the caller's neutral
 * section name into the slug the matching route reads.
 *
 * An unrecognized section is dropped rather than passed through: each route
 * resolves an unknown `?section=` back to its default tab anyway, so forwarding
 * one only puts a dead value in a shareable URL.
 *
 * @param view - The requested view.
 * @return The search params to merge.
 */
function analyticsSection( view: AnalyticsView ): Record< string, string > {
	const section =
		view.view === 'dashboard'
			? view.section && DASHBOARD_SECTIONS[ view.section ]
			: view.section && POST_SECTIONS[ view.section ];

	return section ? { section } : {};
}

/**
 * Builds the URL for a destination in the Premium Analytics dashboard.
 *
 * Callers describe *where they want to go*, not how to spell it: the page slug,
 * the site and blog identifiers, the section vocabulary and the date encoding
 * are all resolved here, so no call site holds the dashboard's URL grammar.
 *
 * The dashboard is a single admin page running a client-side router, and
 * `@wordpress/boot` keeps that router's whole path-and-search in one `p` query
 * param rather than a hash — so the internal path is built first and then
 * encoded into `p`.
 *
 * Returns null when there is nowhere to send the user: the dashboard is not the
 * analytics UI here (check `hasAnalyticsDashboard()` first and keep your
 * existing link), the current user cannot open it, or the view has no route.
 *
 * @param view - The requested view.
 * @return The URL, or null.
 *
 * @example
 * hasAnalyticsDashboard()
 *     ? getAnalyticsUrl( { view: 'dashboard', section: 'subscribers' } )
 *     : legacyStatsUrl;
 */
export function getAnalyticsUrl( view: AnalyticsView ): string | null {
	const analytics = getAnalyticsScriptData();

	if ( ! analytics || ! analytics.can_view ) {
		return null;
	}

	const path = analyticsPath( view );
	if ( ! path ) {
		return null;
	}

	const search = new URLSearchParams( {
		...analyticsSection( view ),
		...( view.range ? rangeParams( view.range, analytics.timezone ) : {} ),
	} );
	const query = search.toString();

	const page = new URLSearchParams( {
		page: analytics.page_slug,
		p: query ? `${ path }?${ query }` : path,
	} );

	return getAdminUrl( `admin.php?${ page }` );
}
