/**
 * Links into the site's analytics dashboard.
 *
 * Imported by relative path from three bundles built by two webpack configs, so
 * it lives here rather than in a shared package. My Jetpack deliberately does
 * not use it — its Stats card gets the destination as the product's
 * `manage_url`, resolved server-side.
 */

import { getAdminUrl, getScriptData } from '@automattic/jetpack-script-data';
import { tz, TZDateMini } from '@date-fns/tz';
import { endOfDay, format, startOfDay } from 'date-fns';

/**
 * Published by Premium Analytics only where it is the site's analytics UI, so
 * its presence is the branch signal.
 */
interface AnalyticsScriptData {
	enabled: boolean;
	page_slug: string;

	/**
	 * False means hide analytics links rather than lead to a capability error.
	 */
	can_view: boolean;

	/**
	 * An IANA name (`America/New_York`), or a fixed UTC offset (`+05:30`).
	 */
	timezone: string;
}

/*
 * Declared here rather than in the script-data package: the key is published by
 * Premium Analytics and read only by this file.
 */
declare module '@automattic/jetpack-script-data' {
	interface JetpackScriptData {
		analytics?: AnalyticsScriptData;
	}
}

// Matches the dashboard's own `dateToISOStringWithTZ`.
const ISO_WITH_OFFSET = "yyyy-MM-dd'T'HH:mm:ss.SSSxxx";

/** A range of whole calendar days in the site's timezone, as `YYYY-MM-DD`. */
interface AnalyticsDateRange {
	from: string;
	to: string;
}

type AnalyticsDashboardSection = 'traffic' | 'insights' | 'subscribers' | 'store';
type AnalyticsPostSection = 'traffic' | 'email-opens' | 'email-clicks';

/**
 * Where to go, not how the URL is spelled.
 *
 * Only the two views Jetpack links to are modelled; the dashboard also serves
 * `/reports/$report` and `/video/$videoId`. Deliberately absent: the site and
 * blog identifiers, resolved from script data so callers need not thread them
 * through props.
 */
export type AnalyticsView =
	| { view: 'dashboard'; section?: AnalyticsDashboardSection; range?: AnalyticsDateRange }
	| { view: 'post'; id: number; section?: AnalyticsPostSection; range?: AnalyticsDateRange };

/**
 * `?section=` takes the slug — the segment after the namespace, so
 * `analytics/traffic` is registered and `traffic` reaches the URL. A list, not a
 * map, because the two coincide; it exists to reject unknown values arriving
 * from untyped JS callers.
 */
const DASHBOARD_SECTIONS: readonly string[] = [ 'traffic', 'insights', 'subscribers', 'store' ];

/** Callers say `traffic`; the tab layout registry calls it `post-traffic`. */
const POST_SECTIONS: Record< AnalyticsPostSection, string > = {
	traffic: 'post-traffic',
	'email-opens': 'email-opens',
	'email-clicks': 'email-clicks',
};

/**
 * Reads the key Premium Analytics publishes.
 *
 * @return The analytics script data, or undefined where the dashboard is not the analytics UI.
 */
function getAnalyticsScriptData(): AnalyticsScriptData | undefined {
	const analytics = getScriptData()?.analytics;

	return analytics?.enabled ? analytics : undefined;
}

/**
 * Whether to route analytics links to the dashboard.
 *
 * The Stats page still renders alongside the dashboard for now, so this is
 * about which one a link should point at, not about one having gone away.
 *
 * Distinct from a null URL: false means "keep your existing Stats link", null
 * means the dashboard is the analytics UI here but this user cannot open it.
 * Hiding the control beats falling back, because the dashboard capability maps
 * to `manage_options` or `view_stats` — a user who fails it cannot open the
 * Stats page either.
 *
 * @return Whether the dashboard is the analytics UI here.
 */
export function hasAnalyticsDashboard(): boolean {
	return getAnalyticsScriptData() !== undefined;
}

/**
 * Encodes a calendar day as the offset-bearing timestamp the dashboard writes
 * itself. A bare `YYYY-MM-DD` would be parsed as UTC midnight and land a day
 * early west of UTC.
 *
 * `TZDateMini`'s parts constructor reads the wall clock *in* the target zone, so
 * the offset is the one in effect on that day — which differs between the two
 * boundaries across a daylight-saving transition.
 *
 * @param day      - The calendar day, `YYYY-MM-DD` in the site's timezone.
 * @param boundary - Which end of the day to encode.
 * @param timezone - An IANA name or a fixed UTC offset.
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

		return format( at, ISO_WITH_OFFSET, { in: tz( timezone ) } );
	} catch {
		// An unusable zone throws a RangeError out of Intl.
		return undefined;
	}
}

/**
 * A half-applied range would silently widen the window, so an unusable one is
 * dropped whole. `interval`, `preset` and the comparison params are left off:
 * the route seeds an interval itself, and omitting `preset` keeps the range
 * custom rather than forcing a comparison nobody asked for.
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
 * An unknown section resolves to the route's default tab anyway, so it is
 * dropped rather than left dead in a shareable URL.
 *
 * @param view - The requested view.
 * @return The search params to merge.
 */
function analyticsSection( view: AnalyticsView ): Record< string, string > {
	const section =
		view.view === 'dashboard'
			? view.section && DASHBOARD_SECTIONS.includes( view.section ) && view.section
			: view.section && POST_SECTIONS[ view.section ];

	return section ? { section } : {};
}

/**
 * Builds a URL into the Premium Analytics dashboard.
 *
 * `@wordpress/boot` keeps the client-side router's whole path-and-search in one
 * `p` query param, so the internal path is built first and then encoded into it.
 *
 * @param view - The requested view.
 * @return The URL, or null when the dashboard is not the analytics UI, the user cannot open it, or the view has no route.
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

	const path = view.view === 'dashboard' ? '/' : view.id > 0 && `/post/${ view.id }`;
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
