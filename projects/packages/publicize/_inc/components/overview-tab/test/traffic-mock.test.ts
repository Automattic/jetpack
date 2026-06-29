import { buildMockReferrers } from '../traffic-mock';

describe( 'buildMockReferrers', () => {
	it( 'produces exactly `interval` days', () => {
		expect( Object.keys( buildMockReferrers( 7 ) ) ).toHaveLength( 7 );
		expect( Object.keys( buildMockReferrers( 30 ) ) ).toHaveLength( 30 );
	} );

	it( 'is deterministic across calls', () => {
		expect( buildMockReferrers( 7 ) ).toEqual( buildMockReferrers( 7 ) );
	} );

	it( 'keys days by YYYY-MM-DD', () => {
		for ( const key of Object.keys( buildMockReferrers( 7 ) ) ) {
			expect( key ).toMatch( /^\d{4}-\d{2}-\d{2}$/ );
		}
	} );

	it( 'keeps every group total at or above 1 and sums total_views', () => {
		for ( const day of Object.values( buildMockReferrers( 7 ) ) ) {
			const groups = day.groups ?? [];
			const sum = groups.reduce( ( acc, g ) => acc + ( g.total ?? 0 ), 0 );
			expect( day.total_views ).toBe( sum );
			for ( const group of groups ) {
				expect( group.total ?? 0 ).toBeGreaterThanOrEqual( 1 );
			}
		}
	} );

	it( 'emits hosts that resolve to known social services', () => {
		const firstDay = Object.values( buildMockReferrers( 7 ) )[ 0 ];
		const hosts = ( firstDay.groups ?? [] ).map( g => g.name );
		expect( hosts ).toEqual(
			expect.arrayContaining( [ 'facebook.com', 'x.com', 'linkedin.com' ] )
		);
	} );
} );
