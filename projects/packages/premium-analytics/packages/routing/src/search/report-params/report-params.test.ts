import { buildDashboardLink, pickReportDateParams } from './report-params';

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
		expect(
			buildDashboardLink( {
				from: '2026-01-01',
				period: 'week',
				post_id: '42',
				section: 'archives',
			} )
		).toBe( '/?from=2026-01-01' );
	} );
} );
