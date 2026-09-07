import {
	buildDashboardLink,
	buildReportLink,
	hasPrimaryDateDraft,
	omitComparisonReportParams,
	pickReportDateParams,
} from './report-params';

/**
 * Read a link's querystring the way the router reads it, so a test asserts the
 * values the destination route receives rather than their raw encoding.
 *
 * @param url - The parsed link.
 * @return The search params, parsed.
 */
function parseSearch( url: URL ): Record< string, unknown > {
	const parsed: Record< string, unknown > = {};

	for ( const [ key, value ] of url.searchParams ) {
		try {
			parsed[ key ] = JSON.parse( value );
		} catch {
			parsed[ key ] = value;
		}
	}

	return parsed;
}

function expectLink( link: string, pathname: string, search: Record< string, unknown > ) {
	const url = new URL( link, 'https://example.com' );

	expect( url.pathname ).toBe( pathname );
	expect( parseSearch( url ) ).toEqual( search );
}

describe( 'pickReportDateParams', () => {
	it( 'keeps only the shared report-window params that are set', () => {
		expect(
			pickReportDateParams( {
				from: '2026-01-01',
				to: '2026-01-31',
				post_id: '42',
				section: 'archives',
			} )
		).toEqual( { from: '2026-01-01', to: '2026-01-31' } );
	} );

	it( 'returns an empty object for undefined search', () => {
		expect( pickReportDateParams( undefined ) ).toEqual( {} );
	} );

	it( 'does not pick the page-owned chart period', () => {
		expect( pickReportDateParams( { from: '2026-01-01', period: 'week' } ) ).toEqual( {
			from: '2026-01-01',
		} );
	} );
} );

describe( 'omitComparisonReportParams', () => {
	it( 'drops only the comparison params, keeping the window and page scope', () => {
		expect(
			omitComparisonReportParams( {
				from: '2026-01-01',
				to: '2026-01-31',
				interval: 'day',
				preset: 'last-30-days',
				date_type: 'created',
				post_id: '42',
				section: 'email-opens',
				comp: '1',
				compare_from: '2025-12-02',
				compare_to: '2025-12-31',
				compare_preset: 'previous-period',
			} )
		).toEqual( {
			from: '2026-01-01',
			to: '2026-01-31',
			interval: 'day',
			preset: 'last-30-days',
			date_type: 'created',
			post_id: '42',
			section: 'email-opens',
		} );
	} );

	it( 'returns a copy when no comparison params are present', () => {
		const search = { from: '2026-01-01', to: '2026-01-31' };

		const result = omitComparisonReportParams( search );

		expect( result ).toEqual( search );
		expect( result ).not.toBe( search );
	} );

	it( 'returns an empty object for missing search', () => {
		expect( omitComparisonReportParams( undefined ) ).toEqual( {} );
	} );
} );

describe( 'buildDashboardLink', () => {
	it( 'returns the bare dashboard path when no report params are set', () => {
		expect( buildDashboardLink( {} ) ).toBe( '/' );
		expect( buildDashboardLink( undefined ) ).toBe( '/' );
	} );

	it( 'serializes the shared report window into the querystring', () => {
		// `comp: '1'` is JSON-quoted so the router's JSON-parsing search reader
		// yields the string '1' back, not the number 1 — matching how the router
		// itself writes ambiguous string values.
		expect( buildDashboardLink( { from: '2026-01-01', to: '2026-01-31', comp: '1' } ) ).toBe(
			'/?from=2026-01-01&to=2026-01-31&comp=%221%22'
		);
	} );

	it( 'round-trips search value types through the router-style JSON parse', () => {
		const link = buildDashboardLink( {
			from: '2026-07-05T00:00:00.000+08:00',
			preset: 'last-30-days',
			comp: '1',
		} );
		const query = new URLSearchParams( link.slice( link.indexOf( '?' ) + 1 ) );
		const parseLikeRouter = ( value: string ) => {
			try {
				return JSON.parse( value );
			} catch {
				return value;
			}
		};
		expect( parseLikeRouter( query.get( 'comp' ) as string ) ).toBe( '1' );
		expect( parseLikeRouter( query.get( 'preset' ) as string ) ).toBe( 'last-30-days' );
		expect( parseLikeRouter( query.get( 'from' ) as string ) ).toBe(
			'2026-07-05T00:00:00.000+08:00'
		);
	} );

	it( 'drops page-scoped params, carrying only the report window', () => {
		expect.assertions( 2 );
		expectLink(
			buildDashboardLink( {
				from: '2026-01-01',
				period: 'week',
				post_id: '42',
				section: 'archives',
			} ),
			'/',
			{ from: '2026-01-01' }
		);
	} );
} );

describe( 'buildReportLink', () => {
	it( 'serializes the shared report window into the querystring', () => {
		expect.assertions( 2 );
		expectLink(
			buildReportLink( 'videos', {
				from: '2026-01-01',
				to: '2026-01-31',
				compare_from: '2025-12-01',
				comp: '1',
			} ),
			'/reports/videos',
			{
				from: '2026-01-01',
				to: '2026-01-31',
				compare_from: '2025-12-01',
				comp: '1',
			}
		);
	} );

	it( 'quotes a numeric string so it survives the router round trip', () => {
		expect.assertions( 3 );

		const link = buildReportLink( 'videos', { comp: '1' } );

		expect( link ).toBe( '/reports/videos?comp=%221%22' );
		expectLink( link, '/reports/videos', { comp: '1' } );
	} );

	it( 'leaves a value that is not valid JSON unquoted', () => {
		expect( buildReportLink( 'videos', { from: '2026-01-01' } ) ).toBe(
			'/reports/videos?from=2026-01-01'
		);
	} );

	it( 'appends the referring report section when supplied', () => {
		expect.assertions( 2 );
		expectLink(
			buildReportLink(
				'comments',
				{ from: '2026-01-01', to: '2026-01-31', ref_section: 'ignored' },
				'posts'
			),
			'/reports/comments',
			{ from: '2026-01-01', to: '2026-01-31', section: 'posts' }
		);
	} );

	it( 'drops detail-page params, carrying only the report window', () => {
		expect.assertions( 2 );
		expectLink(
			buildReportLink( 'emails', {
				from: '2026-01-01',
				post_id: '42',
				section: 'email-opens',
				ref: 'emails',
				ref_section: 'posts',
			} ),
			'/reports/emails',
			{ from: '2026-01-01' }
		);
	} );
} );

describe( 'hasPrimaryDateDraft', () => {
	const applied = { from: '2026-07-01', to: '2026-07-30', preset: 'last-30-days' };

	it( 'reports no draft for the applied window', () => {
		expect( hasPrimaryDateDraft( applied, { ...applied } ) ).toBe( false );
	} );

	it.each( [ 'from', 'to', 'preset' ] )( 'reports a draft on a changed %s', key => {
		expect( hasPrimaryDateDraft( applied, { ...applied, [ key ]: 'other' } ) ).toBe( true );
	} );

	// The comparison and interval controls ride along with a range draft, so
	// their own changes must not read as one.
	it( 'ignores params the picker does not own', () => {
		const draft = { ...applied, interval: 'week' };

		expect( hasPrimaryDateDraft( applied, draft ) ).toBe( false );
	} );

	it( 'treats a missing window as a draft against a set one', () => {
		expect( hasPrimaryDateDraft( undefined, applied ) ).toBe( true );
		expect( hasPrimaryDateDraft( undefined, undefined ) ).toBe( false );
	} );
} );
