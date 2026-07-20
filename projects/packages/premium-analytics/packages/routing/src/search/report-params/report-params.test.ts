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
		expect( buildDashboardLink( { from: '2026-01-01', to: '2026-01-31', comp: '1' } ) ).toBe(
			'/?from=2026-01-01&to=2026-01-31&comp=1'
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
