import selectors from '../api';

describe( 'apiSelectors', () => {
	describe( 'getAPIRoot()', () => {
		it( 'should return null when API state is an empty object', () => {
			const state = {
				API: {},
			};
			const output = selectors.getAPIRoot( state );
			expect( output ).toBeNull();
		} );

		it( 'should return null when API state does not include WP_API_root', () => {
			const state = {
				API: {
					dummyItem: 'dummyValue',
				},
			};
			const output = selectors.getAPIRoot( state );
			expect( output ).toBeNull();
		} );

		it( 'should return WP_API_root value if API object includes it', () => {
			const state = {
				API: {
					WP_API_root: 'https://wordpress.com/wp-json/',
				},
			};
			const output = selectors.getAPIRoot( state );
			expect( output ).toBe( 'https://wordpress.com/wp-json/' );
		} );
	} );

	describe( 'getAPINonce()', () => {
		it( 'should return null when API state is an empty object', () => {
			const state = {
				API: {},
			};
			const output = selectors.getAPINonce( state );
			expect( output ).toBeNull();
		} );

		it( 'should return null when API state does not include WP_API_nonce', () => {
			const state = {
				API: {
					dummyItem: 'dummyValue',
				},
			};
			const output = selectors.getAPINonce( state );
			expect( output ).toBeNull();
		} );

		it( 'should return WP_API_nonce value if API object includes it', () => {
			const state = {
				API: {
					WP_API_nonce: 123456,
				},
			};
			const output = selectors.getAPINonce( state );
			expect( output ).toBe( 123456 );
		} );
	} );

	describe( 'getRegistrationNonce()', () => {
		it( 'should return null when API state is an empty object', () => {
			const state = {
				API: {},
			};
			const output = selectors.getRegistrationNonce( state );
			expect( output ).toBeNull();
		} );

		it( 'should return null when API state does not include registrationNonce', () => {
			const state = {
				API: {
					dummyItem: 'dummyValue',
				},
			};
			const output = selectors.getRegistrationNonce( state );
			expect( output ).toBeNull();
		} );

		it( 'should return registrationNonce value if API object includes it', () => {
			const state = {
				API: {
					registrationNonce: 123456,
				},
			};
			const output = selectors.getRegistrationNonce( state );
			expect( output ).toBe( 123456 );
		} );
	} );
} );
