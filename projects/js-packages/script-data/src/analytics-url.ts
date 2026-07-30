import { getScriptData, getAdminUrl } from './utils.ts';
import type {
	AnalyticsDateRange,
	AnalyticsPostSection,
	AnalyticsScriptData,
	AnalyticsView,
} from './types.ts';

/**
 * The legacy Stats page slug. Registered by the Stats admin package, and still
 * the analytics UI on any site where Premium Analytics is not the dashboard.
 */
const STATS_PAGE_SLUG = 'stats';

/**
 * Premium Analytics' dashboard sections, keyed by the neutral section name
 * callers use. The dashboard reads `?section=` as a section *slug* — the
 * segment after the namespace in the server-side registry (`analytics/traffic`
 * is registered, `traffic` is what reaches the URL).
 */
const PA_DASHBOARD_SECTIONS = {
	traffic: 'traffic',
	insights: 'insights',
	subscribers: 'subscribers',
	store: 'store',
} as const;

/**
 * Premium Analytics' post-detail tabs, keyed by the neutral section name.
 * Callers say `traffic`; the tab layout registry calls it `post-traffic`.
 */
const PA_POST_SECTIONS: Record< AnalyticsPostSection, string > = {
	traffic: 'post-traffic',
	'email-opens': 'email-opens',
	'email-clicks': 'email-clicks',
};

/**
 * Reads the `analytics` script data published by the Premium Analytics package.
 *
 * The package only publishes this on sites where it *is* the analytics UI, so
 * its presence is the branch signal: present means build Premium Analytics
 * routes, absent means build legacy Stats routes.
 *
 * @return The analytics script data, or undefined on a legacy Stats site.
 */
function getAnalyticsScriptData(): AnalyticsScriptData | undefined {
	const analytics = getScriptData()?.analytics;

	return analytics?.enabled ? analytics : undefined;
}

/**
 * Normalizes a fixed UTC offset into the `+HH:MM` form the analytics URL
 * grammar uses, or returns undefined when the value is not a fixed offset (an
 * IANA zone name such as `America/New_York`).
 *
 * @param timezone - The site timezone, either an IANA name or a fixed offset.
 * @return The normalized offset, or undefined for an IANA zone name.
 */
function toFixedOffset( timezone: string ): string | undefined {
	if ( timezone === 'UTC' || timezone === 'Z' ) {
		return '+00:00';
	}

	const match = /^([+-])(\d{1,2}):?(\d{2})?$/.exec( timezone.trim() );
	if ( ! match ) {
		return undefined;
	}

	const [ , sign, hours, minutes = '00' ] = match;

	return `${ sign }${ hours.padStart( 2, '0' ) }:${ minutes }`;
}

/**
 * The site's UTC offset at a given instant, as `+HH:MM`.
 *
 * `longOffset` renders as `GMT-04:00`, or a bare `GMT` when the zone is exactly
 * UTC at that instant.
 *
 * @param timezone - An IANA timezone name.
 * @param instant  - The instant to read the offset at, in epoch milliseconds.
 * @return The UTC offset, or undefined when the zone name is unusable.
 */
function offsetAt( timezone: string, instant: number ): string | undefined {
	let name: string | undefined;
	try {
		name = new Intl.DateTimeFormat( 'en-US', { timeZone: timezone, timeZoneName: 'longOffset' } )
			.formatToParts( new Date( instant ) )
			.find( part => part.type === 'timeZoneName' )?.value;
	} catch {
		// An unknown zone name throws a RangeError.
		return undefined;
	}

	if ( name === 'GMT' ) {
		return '+00:00';
	}

	return name?.startsWith( 'GMT' ) ? toFixedOffset( name.slice( 3 ) ) : undefined;
}

/**
 * Converts an offset in `+HH:MM` form to minutes east of UTC.
 *
 * @param offset - The offset to convert.
 * @return The offset in minutes.
 */
function offsetToMinutes( offset: string ): number {
	const sign = offset.startsWith( '-' ) ? -1 : 1;
	const [ hours, minutes ] = offset.slice( 1 ).split( ':' );

	return sign * ( Number( hours ) * 60 + Number( minutes ) );
}

/**
 * Encodes a calendar day as the offset-bearing ISO timestamp the analytics
 * dashboard writes to its own URL (`yyyy-MM-dd'T'HH:mm:ss.SSSxxx`, in the site
 * timezone). The date picker parses `from`/`to` as instants, so a bare
 * `YYYY-MM-DD` would be read as UTC midnight and land on the previous day for
 * any site west of UTC.
 *
 * @param day      - The calendar day, `YYYY-MM-DD` in the site's timezone.
 * @param boundary - Which end of the day to encode.
 * @param timezone - The site timezone, either an IANA name or a fixed offset.
 * @return The encoded timestamp, or undefined when the day cannot be encoded.
 */
function encodeDay( day: string, boundary: 'start' | 'end', timezone: string ): string | undefined {
	if ( ! /^\d{4}-\d{2}-\d{2}$/.test( day ) ) {
		return undefined;
	}

	const time = boundary === 'start' ? '00:00:00.000' : '23:59:59.999';

	const fixed = toFixedOffset( timezone );
	if ( fixed ) {
		return `${ day }T${ time }${ fixed }`;
	}

	/*
	 * The wall-clock time is known but its instant is not, and the offset of an
	 * IANA zone depends on the instant. Read the offset once treating the wall
	 * clock as UTC, use it to place the real instant, then read the offset
	 * again there. The second read is the offset actually in effect at this
	 * wall-clock time, which matters on a DST-transition day: the offset at
	 * local midnight can differ from the one later the same day.
	 */
	const naive = Date.parse( `${ day }T${ time }Z` );
	const guess = offsetAt( timezone, naive );
	if ( ! guess ) {
		return undefined;
	}

	const offset = offsetAt( timezone, naive - offsetToMinutes( guess ) * 60_000 ) ?? guess;

	return `${ day }T${ time }${ offset }`;
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
 * Premium Analytics route.
 *
 * @param view - The requested view.
 * @return The internal path, e.g. `/reports/emails`.
 */
function paPath( view: AnalyticsView ): string | undefined {
	switch ( view.view ) {
		case 'dashboard':
			return '/';
		case 'report':
			return view.report ? `/reports/${ encodeURIComponent( view.report ) }` : undefined;
		case 'post':
			return view.id > 0 ? `/post/${ view.id }` : undefined;
		case 'video':
			return view.id > 0 ? `/video/${ view.id }` : undefined;
		default:
			return undefined;
	}
}

/**
 * Builds the `?section=` param for a view, translating the caller's neutral
 * section name into the slug the matching Premium Analytics route reads.
 *
 * An unrecognized section is dropped rather than passed through: each route
 * resolves an unknown `?section=` back to its default tab anyway, so forwarding
 * one only puts a dead value in a shareable URL.
 *
 * @param view - The requested view.
 * @return The search params to merge.
 */
function paSection( view: AnalyticsView ): Record< string, string > {
	if ( view.view === 'dashboard' ) {
		const section = view.section && PA_DASHBOARD_SECTIONS[ view.section ];

		return section ? { section } : {};
	}

	if ( view.view === 'post' ) {
		const section = view.section && PA_POST_SECTIONS[ view.section ];

		return section ? { section } : {};
	}

	// Reports own their section vocabulary, so pass the caller's value through.
	if ( view.view === 'report' && view.section ) {
		return { section: view.section };
	}

	return {};
}

/**
 * Builds a Premium Analytics URL.
 *
 * The dashboard is a single admin page running a client-side router, and
 * `@wordpress/boot` keeps that router's whole path-and-search in a single `p`
 * query param rather than a hash — so the internal path is built first and then
 * encoded into `p`.
 *
 * @param view      - The requested view.
 * @param analytics - The analytics script data.
 * @return The URL, or null when the view has no route.
 */
function premiumAnalyticsUrl( view: AnalyticsView, analytics: AnalyticsScriptData ): string | null {
	const path = paPath( view );
	if ( ! path ) {
		return null;
	}

	const search = new URLSearchParams( {
		...paSection( view ),
		...( view.range ? rangeParams( view.range, analytics.timezone ) : {} ),
	} );
	const query = search.toString();

	const page = new URLSearchParams( {
		page: analytics.page_slug,
		p: query ? `${ path }?${ query }` : path,
	} );

	return getAdminUrl( `admin.php?${ page }` );
}

/**
 * Builds a legacy Stats URL.
 *
 * Stats runs the Calypso-derived Odyssey bundle behind a hash route, and only
 * ever exposed a handful of deep-link shapes. Views it has no counterpart for
 * fall back to the Stats page root, which is a working — if undeep — landing
 * spot, rather than null: the link is still worth showing.
 *
 * @param view - The requested view.
 * @return The URL.
 */
function statsUrl( view: AnalyticsView ): string {
	const root = getAdminUrl( `admin.php?page=${ STATS_PAGE_SLUG }` );
	const site = getScriptData()?.site?.suffix;
	const blogId = getScriptData()?.site?.wpcom?.blog_id;

	if ( view.view === 'dashboard' && site ) {
		if ( view.section === 'subscribers' ) {
			return `${ root }#!/stats/subscribers/${ site }`;
		}

		if ( view.section === 'traffic' && view.range?.from ) {
			/*
			 * Odyssey reads `startDate` as an instant, and the Stats API reports
			 * calendar days, so the day is encoded as UTC midnight — the same
			 * encoding the chart itself uses for its labels.
			 */
			const startDate = `${ view.range.from }T00:00:00.000Z`;

			return `${ root }#!/stats/day/${ site }?startDate=${ startDate }`;
		}
	}

	if ( view.view === 'post' && view.id > 0 && blogId && view.section === 'email-opens' ) {
		return `${ root }#!/stats/email/opens/day/${ view.id }/${ blogId }`;
	}

	return root;
}

/**
 * Builds the URL for an analytics destination, on whichever analytics UI this
 * site runs.
 *
 * Callers describe *where they want to go*, not how to spell it: the site's
 * analytics UI (Premium Analytics or legacy Stats), the page slug, the site and
 * blog identifiers, the section vocabulary and the date encoding are all
 * resolved here. That keeps one translation table per UI instead of a URL
 * template at every call site.
 *
 * Returns null when there is nowhere to send the user — either the view has no
 * route, or the current user cannot open the analytics dashboard. Callers
 * should hide the control rather than render a dead link.
 *
 * @param view - The requested view.
 * @return The URL, or null when the control should be hidden.
 *
 * @example
 * getAnalyticsUrl( { view: 'dashboard', section: 'subscribers' } );
 * getAnalyticsUrl( { view: 'post', id: 42, section: 'email-opens' } );
 */
export function getAnalyticsUrl( view: AnalyticsView ): string | null {
	const analytics = getAnalyticsScriptData();

	if ( ! analytics ) {
		return statsUrl( view );
	}

	if ( ! analytics.can_view ) {
		return null;
	}

	return premiumAnalyticsUrl( view, analytics );
}
