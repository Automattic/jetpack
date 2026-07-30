import { getAnalyticsUrl, hasAnalyticsDashboard } from '../analytics-url.ts';
import type { AnalyticsScriptData, JetpackScriptData } from '../types.ts';

const ADMIN_URL = 'https://example.com/wp-admin/';
const PAGE_SLUG = 'jetpack-premium-analytics-wp-admin';

/**
 * Seeds `window.JetpackScriptData` with an optional `analytics` payload.
 * Omitting it is a site where the dashboard is not the analytics UI.
 *
 * @param analytics - The analytics payload, or undefined to omit the key.
 */
function seedScriptData( analytics?: Partial< AnalyticsScriptData > ) {
	window.JetpackScriptData = {
		site: { admin_url: ADMIN_URL },
		user: { current_user: { capabilities: {} } },
		...( analytics
			? {
					analytics: {
						enabled: true,
						page_slug: PAGE_SLUG,
						can_view: true,
						timezone: 'UTC',
						...analytics,
					},
			  }
			: {} ),
	} as unknown as JetpackScriptData;
}

/**
 * Resolves a dashboard URL to the path and search the router ends up with, so
 * assertions read the values the route receives rather than an encoded string.
 *
 * The dashboard keeps its whole path-and-search inside a single `p` query
 * param, so the router decodes twice: once pulling `p` off the page URL, and
 * once parsing `p`'s own search. This mirrors both steps.
 *
 * @param url - The URL to parse.
 * @return The decoded path and search, e.g. `/?section=traffic`.
 */
function routerPath( url: string | null ): string | null {
	if ( ! url ) {
		return null;
	}

	// Step one: the browser decodes `p` off the page URL.
	const path = new URL( url ).searchParams.get( 'p' );
	if ( ! path ) {
		return null;
	}

	// Step two: the router parses `p`'s search the same way.
	const [ pathname, search ] = path.split( '?' );
	if ( ! search ) {
		return pathname;
	}

	const params = [ ...new URLSearchParams( search ) ]
		.map( ( [ key, value ] ) => `${ key }=${ value }` )
		.join( '&' );

	return `${ pathname }?${ params }`;
}

afterEach( () => {
	delete window.JetpackScriptData;
} );

describe( 'hasAnalyticsDashboard', () => {
	it( 'is true when the package announces itself', () => {
		seedScriptData( {} );

		expect( hasAnalyticsDashboard() ).toBe( true );
	} );

	// Callers read this to decide whether to replace their existing Stats link.
	// It must stay true regardless of capability: a user who cannot open the
	// dashboard must not be sent to the Stats page, which is no longer
	// registered once the dashboard replaces it.
	it( 'stays true for a user who cannot open the dashboard', () => {
		seedScriptData( { can_view: false } );

		expect( hasAnalyticsDashboard() ).toBe( true );
	} );

	it.each( [
		[ 'the key is absent', undefined ],
		[ 'the key is present but disabled', { enabled: false } ],
	] )( 'is false when %s', ( _label, analytics ) => {
		seedScriptData( analytics );

		expect( hasAnalyticsDashboard() ).toBe( false );
	} );
} );

describe( 'getAnalyticsUrl', () => {
	it( 'points at the dashboard page', () => {
		seedScriptData( {} );

		const url = getAnalyticsUrl( { view: 'dashboard' } );

		expect( url ).toBe( `${ ADMIN_URL }admin.php?page=${ PAGE_SLUG }&p=%2F` );
	} );

	it( 'omits an empty search rather than trailing a bare "?"', () => {
		seedScriptData( {} );

		expect( routerPath( getAnalyticsUrl( { view: 'dashboard' } ) ) ).toBe( '/' );
	} );

	it( 'encodes the inner search twice, matching the two decodes the router does', () => {
		seedScriptData( { timezone: 'UTC' } );

		const raw = getAnalyticsUrl( {
			view: 'dashboard',
			range: { from: '2026-07-01', to: '2026-07-01' },
		} ) as string;

		// The `+` of the UTC offset must survive as `%252B` in the page URL: one
		// layer for `p`'s own search, one for `p` itself. A single layer would
		// decode to a space and the date picker would reject the range.
		expect( raw ).toContain( '%252B00%253A00' );
		expect( new URL( raw ).searchParams.get( 'p' ) ).toContain( '%2B00%3A00' );
	} );

	describe( 'view routing', () => {
		it( 'routes the dashboard view to the root', () => {
			seedScriptData( {} );

			expect( routerPath( getAnalyticsUrl( { view: 'dashboard' } ) ) ).toBe( '/' );
		} );

		it( 'routes the post view to that post', () => {
			seedScriptData( {} );

			expect( routerPath( getAnalyticsUrl( { view: 'post', id: 42 } ) ) ).toBe( '/post/42' );
		} );

		it.each( [
			[ 'a zero post id', 0 ],
			[ 'a negative post id', -1 ],
		] )( 'returns null for %s', ( _label, id ) => {
			seedScriptData( {} );

			expect( getAnalyticsUrl( { view: 'post', id } ) ).toBeNull();
		} );
	} );

	describe( 'section translation', () => {
		it.each( [
			[ 'traffic', 'traffic' ],
			[ 'insights', 'insights' ],
			[ 'subscribers', 'subscribers' ],
			[ 'store', 'store' ],
		] as const )( 'maps the dashboard %s section to ?section=%s', ( section, expected ) => {
			seedScriptData( {} );

			expect( routerPath( getAnalyticsUrl( { view: 'dashboard', section } ) ) ).toBe(
				`/?section=${ expected }`
			);
		} );

		it( 'translates the neutral post "traffic" section to the route\'s own slug', () => {
			seedScriptData( {} );

			expect( routerPath( getAnalyticsUrl( { view: 'post', id: 9, section: 'traffic' } ) ) ).toBe(
				'/post/9?section=post-traffic'
			);
		} );

		it.each( [ 'email-opens', 'email-clicks' ] as const )(
			'passes the post %s section through',
			section => {
				seedScriptData( {} );

				expect( routerPath( getAnalyticsUrl( { view: 'post', id: 9, section } ) ) ).toBe(
					`/post/9?section=${ section }`
				);
			}
		);

		it( 'drops an unrecognized section instead of putting a dead value in the URL', () => {
			seedScriptData( {} );

			const view = { view: 'dashboard', section: 'nope' } as unknown as Parameters<
				typeof getAnalyticsUrl
			>[ 0 ];

			expect( routerPath( getAnalyticsUrl( view ) ) ).toBe( '/' );
		} );
	} );

	describe( 'date range encoding', () => {
		it( 'encodes whole days as the offset-bearing timestamps the dashboard writes itself', () => {
			seedScriptData( { timezone: 'UTC' } );

			expect(
				routerPath(
					getAnalyticsUrl( {
						view: 'dashboard',
						range: { from: '2026-07-01', to: '2026-07-31' },
					} )
				)
			).toBe( '/?from=2026-07-01T00:00:00.000+00:00&to=2026-07-31T23:59:59.999+00:00' );
		} );

		it( 'uses the site timezone offset, not UTC', () => {
			seedScriptData( { timezone: 'America/New_York' } );

			expect(
				routerPath(
					getAnalyticsUrl( { view: 'dashboard', range: { from: '2026-07-04', to: '2026-07-04' } } )
				)
			).toBe( '/?from=2026-07-04T00:00:00.000-04:00&to=2026-07-04T23:59:59.999-04:00' );
		} );

		it( 'accepts a fixed UTC offset timezone', () => {
			seedScriptData( { timezone: '+05:30' } );

			expect(
				routerPath(
					getAnalyticsUrl( { view: 'dashboard', range: { from: '2026-07-04', to: '2026-07-04' } } )
				)
			).toBe( '/?from=2026-07-04T00:00:00.000+05:30&to=2026-07-04T23:59:59.999+05:30' );
		} );

		it( 'uses the offset in effect at each boundary across a DST transition', () => {
			seedScriptData( { timezone: 'America/New_York' } );

			// 2026-03-08 is the US spring-forward date: the range opens on EST
			// and closes on EDT.
			expect(
				routerPath(
					getAnalyticsUrl( { view: 'dashboard', range: { from: '2026-03-08', to: '2026-03-08' } } )
				)
			).toBe( '/?from=2026-03-08T00:00:00.000-05:00&to=2026-03-08T23:59:59.999-04:00' );
		} );

		it( 'carries a range on the post view too, not just the dashboard', () => {
			seedScriptData( { timezone: 'UTC' } );

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

		it( 'never sets interval, preset or comparison params', () => {
			seedScriptData( {} );

			const path = routerPath(
				getAnalyticsUrl( { view: 'dashboard', range: { from: '2026-07-01', to: '2026-07-31' } } )
			);

			expect( path ).not.toContain( 'interval=' );
			expect( path ).not.toContain( 'preset=' );
			expect( path ).not.toContain( 'comp=' );
		} );

		it.each( [
			[ 'a malformed from', { from: '07/01/2026', to: '2026-07-31' } ],
			[ 'a malformed to', { from: '2026-07-01', to: 'yesterday' } ],
			[ 'an empty range', { from: '', to: '' } ],
		] )( 'drops the whole range for %s rather than half-applying it', ( _label, range ) => {
			seedScriptData( {} );

			expect( routerPath( getAnalyticsUrl( { view: 'dashboard', range } ) ) ).toBe( '/' );
		} );

		it( 'drops the range when the timezone is unusable', () => {
			seedScriptData( { timezone: 'Not/AZone' } );

			expect(
				routerPath(
					getAnalyticsUrl( { view: 'dashboard', range: { from: '2026-07-01', to: '2026-07-31' } } )
				)
			).toBe( '/' );
		} );

		it( 'keeps the section when the range is dropped', () => {
			seedScriptData( {} );

			expect(
				routerPath(
					getAnalyticsUrl( {
						view: 'dashboard',
						section: 'traffic',
						range: { from: 'nope', to: 'nope' },
					} )
				)
			).toBe( '/?section=traffic' );
		} );
	} );

	describe( 'when there is nowhere to send the user', () => {
		it( 'returns null for a user who cannot open the dashboard', () => {
			seedScriptData( { can_view: false } );

			expect( getAnalyticsUrl( { view: 'dashboard' } ) ).toBeNull();
			expect( getAnalyticsUrl( { view: 'post', id: 1, section: 'email-opens' } ) ).toBeNull();
		} );

		// Callers gate on hasAnalyticsDashboard() and keep their existing link,
		// so the helper never builds a legacy Stats URL of its own.
		it.each( [
			[ 'the key is absent', undefined ],
			[ 'the key is present but disabled', { enabled: false } ],
		] )( 'returns null when %s', ( _label, analytics ) => {
			seedScriptData( analytics );

			expect( getAnalyticsUrl( { view: 'dashboard' } ) ).toBeNull();
		} );
	} );
} );
