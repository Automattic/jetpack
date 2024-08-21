import {
	getScheduledSharesCount,
	getSharedPostsCount,
	getSharesUsedCount,
	getTotalSharesCount,
} from '../shares-data';

describe( 'Social store selectors: sharesData', () => {
	describe( 'getSharesUsedCount', () => {
		it( 'should return the default value when no data', () => {
			expect( getSharesUsedCount( {} ) ).toBe( 0 );
			expect( getSharesUsedCount( { sharesData: {} } ) ).toBe( 0 );
		} );

		it( 'should return the value from state', () => {
			expect( getSharesUsedCount( { sharesData: { publicized_count: 100 } } ) ).toBe( 100 );
			expect( getSharesUsedCount( { sharesData: { publicized_count: 0 } } ) ).toBe( 0 );
		} );
	} );

	describe( 'getScheduledSharesCount', () => {
		it( 'should return the default value when no data', () => {
			expect( getScheduledSharesCount( {} ) ).toBe( 0 );
			expect( getScheduledSharesCount( { sharesData: {} } ) ).toBe( 0 );
		} );

		it( 'should return the value from state', () => {
			expect( getScheduledSharesCount( { sharesData: { to_be_publicized_count: 100 } } ) ).toBe(
				100
			);
			expect( getScheduledSharesCount( { sharesData: { to_be_publicized_count: 0 } } ) ).toBe( 0 );
		} );
	} );

	describe( 'getTotalSharesCount', () => {
		it( 'should return the default value when no data', () => {
			expect( getTotalSharesCount( {} ) ).toBe( 0 );
			expect( getTotalSharesCount( { sharesData: {} } ) ).toBe( 0 );
		} );

		it( 'should return the value from state', () => {
			const cases = [
				[ [ 100, 100 ], 200 ],
				[ [ 0, 0 ], 0 ],
				[ [ 100, 0 ], 100 ],
				[ [ 0, 100 ], 100 ],
			];

			for ( const [ [ publicized_count, to_be_publicized_count ], result ] of cases ) {
				expect(
					getTotalSharesCount( {
						sharesData: {
							to_be_publicized_count,
							publicized_count,
						},
					} )
				).toBe( result );
			}
		} );
	} );

	describe( 'getSharedPostsCount', () => {
		it( 'should return the default value when no data', () => {
			expect( getSharedPostsCount( {} ) ).toBe( 0 );
			expect( getSharedPostsCount( { sharesData: {} } ) ).toBe( 0 );
		} );

		it( 'should return the value from state', () => {
			expect( getSharedPostsCount( { sharesData: { shared_posts_count: 100 } } ) ).toBe( 100 );
			expect( getSharedPostsCount( { sharesData: { shared_posts_count: 0 } } ) ).toBe( 0 );
		} );
	} );
} );
