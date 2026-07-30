import { getAnalyticsUrl } from '../analytics-url.ts';
import type { AnalyticsScriptData, JetpackScriptData } from '../types.ts';

const ADMIN_URL = 'https://example.com/wp-admin/';
const PA_PAGE = 'jetpack-premium-analytics-wp-admin';

/**
 * Seeds `window.JetpackScriptData` with the site fields `getAnalyticsUrl()`
 * reads, plus an optional `analytics` payload. Omitting `analytics` is the
 * legacy-Stats site.
 *
 * @param analytics - The analytics payload, or undefined for a Stats site.
 * @param site      - Site fields to override.
 */
function seedScriptData(
	analytics?: Partial< AnalyticsScriptData >,
	site: Record< string, unknown > = {}
) {
	window.JetpackScriptData = {
		site: {
			admin_url: ADMIN_URL,
			suffix: 'example.com',
			wpcom: { blog_id: 12345 },
			...site,
		},
		user: { current_user: { capabilities: {} } },
		...( analytics
			? {
					analytics: {
						enabled: true,
						page_slug: PA_PAGE,
						can_view: true,
						timezone: 'UTC',
						...analytics,
					},
			  }
			: {} ),
	} as unknown as JetpackScriptData;
}

/**
 * Resolves a Premium Analytics URL to the path and search the router ends up
 * with, so assertions read the values the route receives rather than an encoded
 * URL string.
 *
 * The dashboard keeps its whole path-and-search inside the single `p` query
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

describe( 'getAnalyticsUrl on a Premium Analytics site', () => {
	it( 'points at the Premium Analytics page, not the Stats page', () => {
		seedScriptData( {} );

		const url = getAnalyticsUrl( { view: 'dashboard' } );

		expect( url ).toBe( `${ ADMIN_URL }admin.php?page=${ PA_PAGE }&p=%2F` );
		expect( url ).not.toContain( 'page=stats' );
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
		it.each( [
			[ 'dashboard', { view: 'dashboard' as const }, '/' ],
			[ 'report', { view: 'report' as const, report: 'emails' as const }, '/reports/emails' ],
			[ 'post', { view: 'post' as const, id: 42 }, '/post/42' ],
			[ 'video', { view: 'video' as const, id: 7 }, '/video/7' ],
		] )( 'routes the %s view to %s', ( _label, view, expected ) => {
			seedScriptData( {} );

			expect( routerPath( getAnalyticsUrl( view ) ) ).toBe( expected );
		} );

		it.each( [
			[ 'a zero post id', { view: 'post' as const, id: 0 } ],
			[ 'a negative post id', { view: 'post' as const, id: -1 } ],
			[ 'a zero video id', { view: 'video' as const, id: 0 } ],
		] )( 'returns null for %s', ( _label, view ) => {
			seedScriptData( {} );

			expect( getAnalyticsUrl( view ) ).toBeNull();
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

		it( 'passes a report section through, since reports own their vocabulary', () => {
			seedScriptData( {} );

			expect(
				routerPath( getAnalyticsUrl( { view: 'report', report: 'utm', section: 'campaigns' } ) )
			).toBe( '/reports/utm?section=campaigns' );
		} );

		it( 'drops an unrecognized dashboard section instead of putting a dead value in the URL', () => {
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

		it( 'pads a single-digit fixed offset', () => {
			seedScriptData( { timezone: '-8:00' } );

			expect(
				routerPath(
					getAnalyticsUrl( { view: 'dashboard', range: { from: '2026-07-04', to: '2026-07-04' } } )
				)
			).toContain( 'from=2026-07-04T00:00:00.000-08:00' );
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

		it( 'carries a range on reports and post detail too, not just the dashboard', () => {
			seedScriptData( { timezone: 'UTC' } );

			expect(
				routerPath(
					getAnalyticsUrl( {
						view: 'report',
						report: 'posts',
						range: { from: '2026-01-01', to: '2026-01-31' },
					} )
				)
			).toBe(
				'/reports/posts?from=2026-01-01T00:00:00.000+00:00&to=2026-01-31T23:59:59.999+00:00'
			);

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

			const path = routerPath( getAnalyticsUrl( { view: 'dashboard', range } ) );

			expect( path ).toBe( '/' );
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

	describe( 'capability', () => {
		it( 'returns null when the user cannot open the dashboard', () => {
			seedScriptData( { can_view: false } );

			expect( getAnalyticsUrl( { view: 'dashboard' } ) ).toBeNull();
		} );

		it( 'returns null for every view when the user cannot view', () => {
			seedScriptData( { can_view: false } );

			expect( getAnalyticsUrl( { view: 'report', report: 'emails' } ) ).toBeNull();
			expect( getAnalyticsUrl( { view: 'post', id: 1, section: 'email-opens' } ) ).toBeNull();
			expect( getAnalyticsUrl( { view: 'video', id: 1 } ) ).toBeNull();
		} );
	} );

	it( 'falls back to the Stats grammar when the payload is present but disabled', () => {
		seedScriptData( { enabled: false } );

		expect( getAnalyticsUrl( { view: 'dashboard' } ) ).toBe( `${ ADMIN_URL }admin.php?page=stats` );
	} );
} );

describe( 'getAnalyticsUrl on a legacy Stats site', () => {
	it( 'links to the Stats page root for the plain dashboard', () => {
		seedScriptData();

		expect( getAnalyticsUrl( { view: 'dashboard' } ) ).toBe( `${ ADMIN_URL }admin.php?page=stats` );
	} );

	it( 'builds the subscribers deep link', () => {
		seedScriptData();

		expect( getAnalyticsUrl( { view: 'dashboard', section: 'subscribers' } ) ).toBe(
			`${ ADMIN_URL }admin.php?page=stats#!/stats/subscribers/example.com`
		);
	} );

	it( 'builds the traffic deep link with the day encoded as UTC midnight', () => {
		seedScriptData();

		expect(
			getAnalyticsUrl( {
				view: 'dashboard',
				section: 'traffic',
				range: { from: '2026-07-29', to: '2026-08-04' },
			} )
		).toBe(
			`${ ADMIN_URL }admin.php?page=stats#!/stats/day/example.com?startDate=2026-07-29T00:00:00.000Z`
		);
	} );

	it( 'builds the email-opens deep link from the post and blog ids', () => {
		seedScriptData();

		expect( getAnalyticsUrl( { view: 'post', id: 99, section: 'email-opens' } ) ).toBe(
			`${ ADMIN_URL }admin.php?page=stats#!/stats/email/opens/day/99/12345`
		);
	} );

	it.each( [
		[ 'a report', { view: 'report' as const, report: 'utm' as const } ],
		[ 'a video', { view: 'video' as const, id: 3 } ],
		[ 'an insights section', { view: 'dashboard' as const, section: 'insights' as const } ],
		[ 'a post traffic tab', { view: 'post' as const, id: 3, section: 'traffic' as const } ],
	] )( 'falls back to the Stats root for %s, which it cannot deep-link', ( _label, view ) => {
		seedScriptData();

		expect( getAnalyticsUrl( view ) ).toBe( `${ ADMIN_URL }admin.php?page=stats` );
	} );

	it( 'falls back to the root when the site suffix is missing', () => {
		seedScriptData( undefined, { suffix: undefined } );

		expect( getAnalyticsUrl( { view: 'dashboard', section: 'subscribers' } ) ).toBe(
			`${ ADMIN_URL }admin.php?page=stats`
		);
	} );

	it( 'falls back to the root when the blog id is missing', () => {
		seedScriptData( undefined, { wpcom: { blog_id: 0 } } );

		expect( getAnalyticsUrl( { view: 'post', id: 99, section: 'email-opens' } ) ).toBe(
			`${ ADMIN_URL }admin.php?page=stats`
		);
	} );

	it( 'never gates on capability, since the Stats page has its own', () => {
		seedScriptData();

		expect( getAnalyticsUrl( { view: 'dashboard' } ) ).not.toBeNull();
	} );
} );
