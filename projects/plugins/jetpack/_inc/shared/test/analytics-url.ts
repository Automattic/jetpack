import { getAnalyticsUrl, hasAnalyticsDashboard } from '../analytics-url';
import type { AnalyticsView } from '../analytics-url';

const ADMIN_URL = 'https://example.com/wp-admin/';
const PAGE_SLUG = 'jetpack-premium-analytics-wp-admin';

/**
 * Seeds `window.JetpackScriptData`. Omitting `analytics` is a site where Stats
 * is still the analytics UI.
 *
 * Every case here pins an explicit timezone and explicit calendar dates, so no
 * assertion depends on the clock or on the machine's timezone.
 *
 * @param analytics - Overrides for the analytics payload, or undefined to omit it.
 */
function seed( analytics?: Record< string, unknown > ) {
	window.JetpackScriptData = {
		site: { admin_url: ADMIN_URL },
		...( analytics && {
			analytics: {
				enabled: true,
				page_slug: PAGE_SLUG,
				can_view: true,
				timezone: 'UTC',
				...analytics,
			},
		} ),
	} as unknown as typeof window.JetpackScriptData;
}

/**
 * The path and search the router ends up with.
 *
 * The dashboard keeps its whole path-and-search inside a single `p` param, so
 * the router decodes twice: once pulling `p` off the page URL, once parsing
 * `p`'s own search. This mirrors both steps.
 *
 * @param url - The URL to parse.
 * @return The decoded path and search, e.g. `/?section=traffic`.
 */
function routerPath( url: string | null ): string | null {
	if ( ! url ) {
		return null;
	}

	const [ path, search ] = ( new URL( url ).searchParams.get( 'p' ) ?? '' ).split( '?' );
	const params = [ ...new URLSearchParams( search ) ].map( ( [ k, v ] ) => `${ k }=${ v }` );

	return params.length ? `${ path }?${ params.join( '&' ) }` : path;
}

afterEach( () => {
	delete window.JetpackScriptData;
} );

describe( 'hasAnalyticsDashboard', () => {
	// Stays true without the capability: a user who fails the dashboard capability
	// fails the Stats page's too, so there is no useful fallback for them.
	it.each( [
		[ 'the package announces itself', {}, true ],
		[ 'the user cannot open it', { can_view: false }, true ],
		[ 'the key is disabled', { enabled: false }, false ],
		[ 'the key is absent', undefined, false ],
	] )( 'is %s -> %s', ( _label, analytics, expected ) => {
		seed( analytics as Record< string, unknown > | undefined );

		expect( hasAnalyticsDashboard() ).toBe( expected );
	} );
} );

describe( 'getAnalyticsUrl', () => {
	beforeEach( () => seed( {} ) );

	it( 'builds a dashboard URL on the dashboard page', () => {
		expect( getAnalyticsUrl( { view: 'dashboard' } ) ).toBe(
			`${ ADMIN_URL }admin.php?page=${ PAGE_SLUG }&p=%2F`
		);
	} );

	it.each( [
		[ { view: 'dashboard' }, '/' ],
		[ { view: 'post', id: 42 }, '/post/42' ],
		[ { view: 'dashboard', section: 'traffic' }, '/?section=traffic' ],
		[ { view: 'dashboard', section: 'insights' }, '/?section=insights' ],
		[ { view: 'dashboard', section: 'subscribers' }, '/?section=subscribers' ],
		[ { view: 'dashboard', section: 'store' }, '/?section=store' ],
		// The caller's neutral `traffic` is the route's `post-traffic`.
		[ { view: 'post', id: 9, section: 'traffic' }, '/post/9?section=post-traffic' ],
		[ { view: 'post', id: 9, section: 'email-opens' }, '/post/9?section=email-opens' ],
		[ { view: 'post', id: 9, section: 'email-clicks' }, '/post/9?section=email-clicks' ],
		// An unknown section resolves to the default tab anyway, so it is dropped
		// rather than left dead in a shareable URL.
		[ { view: 'dashboard', section: 'nope' }, '/' ],
	] as [ AnalyticsView, string ][] )( 'routes %j to %s', ( view, expected ) => {
		expect( routerPath( getAnalyticsUrl( view ) ) ).toBe( expected );
	} );

	it.each( [ 0, -1 ] )( 'returns null for post id %i', id => {
		expect( getAnalyticsUrl( { view: 'post', id } ) ).toBeNull();
	} );

	describe( 'date ranges', () => {
		it.each( [
			[ 'UTC', '+00:00' ],
			[ 'America/New_York', '-04:00' ],
			[ '+05:30', '+05:30' ],
		] )( 'encodes both boundaries in %s', ( timezone, offset ) => {
			seed( { timezone } );

			expect(
				routerPath(
					getAnalyticsUrl( { view: 'dashboard', range: { from: '2026-07-01', to: '2026-07-31' } } )
				)
			).toBe( `/?from=2026-07-01T00:00:00.000${ offset }&to=2026-07-31T23:59:59.999${ offset }` );
		} );

		// A day whose offset changes partway through gets a different offset at
		// each boundary. Both US transitions are covered: one day is 23 hours
		// long, the other 25.
		it.each( [
			[ 'spring forward', '2026-03-08', '-05:00', '-04:00' ],
			[ 'fall back', '2026-11-01', '-04:00', '-05:00' ],
		] )( 'uses the offset in effect at each boundary across %s', ( _label, day, opens, closes ) => {
			seed( { timezone: 'America/New_York' } );

			expect(
				routerPath( getAnalyticsUrl( { view: 'dashboard', range: { from: day, to: day } } ) )
			).toBe( `/?from=${ day }T00:00:00.000${ opens }&to=${ day }T23:59:59.999${ closes }` );
		} );

		it( 'carries a range on the post view too', () => {
			expect(
				routerPath(
					getAnalyticsUrl( {
						view: 'post',
						id: 5,
						range: { from: '2026-01-01', to: '2026-01-01' },
					} )
				)
			).toBe( '/post/5?from=2026-01-01T00:00:00.000+00:00&to=2026-01-01T23:59:59.999+00:00' );
		} );

		// The route seeds an interval itself, and omitting `preset` keeps the
		// range custom rather than forcing a comparison nobody asked for.
		it( 'sets neither interval, preset nor comparison params', () => {
			const path = routerPath(
				getAnalyticsUrl( { view: 'dashboard', range: { from: '2026-07-01', to: '2026-07-31' } } )
			);

			expect( path ).not.toMatch( /interval=|preset=|comp=/ );
		} );

		// Half a range would silently widen the window, so an unusable one is
		// dropped whole — but the section survives.
		it.each( [
			[ 'a malformed from', { from: '07/01/2026', to: '2026-07-31' }, 'UTC' ],
			[ 'a malformed to', { from: '2026-07-01', to: 'yesterday' }, 'UTC' ],
			[ 'an empty range', { from: '', to: '' }, 'UTC' ],
			[ 'an unusable timezone', { from: '2026-07-01', to: '2026-07-31' }, 'Not/AZone' ],
		] )( 'drops the range for %s', ( _label, range, timezone ) => {
			seed( { timezone } );

			expect(
				routerPath( getAnalyticsUrl( { view: 'dashboard', section: 'traffic', range } ) )
			).toBe( '/?section=traffic' );
		} );

		// The `+` of the offset must survive as `%252B`: one layer for `p`'s own
		// search, one for `p` itself. A single layer would decode to a space and
		// the date picker would reject the range.
		it( 'encodes the inner search twice, matching the two decodes the router does', () => {
			const raw = getAnalyticsUrl( {
				view: 'dashboard',
				range: { from: '2026-07-01', to: '2026-07-01' },
			} ) as string;

			expect( raw ).toContain( '%252B00%253A00' );
			expect( new URL( raw ).searchParams.get( 'p' ) ).toContain( '%2B00%3A00' );
		} );
	} );

	it.each( [
		[ 'the user cannot open the dashboard', { can_view: false } ],
		[ 'the dashboard is disabled', { enabled: false } ],
		[ 'the dashboard is not the analytics UI', undefined ],
	] )( 'returns null when %s', ( _label, analytics ) => {
		seed( analytics as Record< string, unknown > | undefined );

		expect( getAnalyticsUrl( { view: 'dashboard' } ) ).toBeNull();
		expect( getAnalyticsUrl( { view: 'post', id: 1, section: 'email-opens' } ) ).toBeNull();
	} );
} );
