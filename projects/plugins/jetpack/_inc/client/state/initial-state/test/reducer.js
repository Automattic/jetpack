import { isWpcomAtomic } from '../reducer';

describe( 'Initial state reducer selectors', () => {
	describe( 'isWpcomAtomic', () => {
		it( 'returns whether the site is hosted on WordPress.com Atomic', () => {
			const state = {
				jetpack: {
					initialState: {
						siteData: {
							isWpcomAtomic: true,
						},
					},
				},
			};

			expect( isWpcomAtomic( state ) ).toBe( true );
		} );

		it( 'defaults to false', () => {
			const state = {
				jetpack: {
					initialState: {
						siteData: {},
					},
				},
			};

			expect( isWpcomAtomic( state ) ).toBe( false );
		} );
	} );
} );
