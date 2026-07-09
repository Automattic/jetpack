import { hasAnyMatchingModule, isModuleFound } from '../index';

describe( 'Module found selector', () => {
	let state = {};

	beforeAll( () => {
		state = {
			jetpack: {
				modules: {
					items: {
						photon: {
							module: 'photon',
							name: 'Photon',
							description: 'Description',
							learn_more_button: 'Learn more',
							long_description: 'Long Description',
							search_terms: 'Search Terms',
							additional_search_queries: 'Additional Queries',
							short_description: 'So short you will be surprised by how it fits into one line',
							feature: 'Some modules do not have it, can you believe it?',
						},
					},
				},
				search: {
					searchTerm: '',
				},
			},
		};
	} );

	describe( 'when there is no search term', () => {
		test( 'returns true for every module', () => {
			expect( isModuleFound( state, 'photon' ) ).toBe( true );
		} );
		test( 'returns false for modules that do not exist', () => {
			expect( isModuleFound( state, 'make-everything-fast' ) ).toBe( false );
			expect( isModuleFound( state, 'take-over-the-world' ) ).toBe( false );
		} );
	} );

	describe( 'for an existing module', () => {
		describe.each( [
			'photon',
			'Description',
			'Learn',
			'Long',
			'Terms',
			'TeRMs', // case sensitivity test
			'quer',
			'surprise',
			'believe',
		] )( 'for the term %s', term => {
			test( 'should match', () => {
				state.jetpack.search.searchTerm = term;

				expect( isModuleFound( state, 'photon' ) ).toBe( true );
			} );
		} );

		describe.each( [ 'nonexistent-slug', 'Decscripton', 'Hocus Pocus', 'something else' ] )(
			'for the term %s',
			term => {
				test( 'should not match', () => {
					state.jetpack.search.searchTerm = term;

					expect( isModuleFound( state, 'photon' ) ).toBe( false );
				} );
			}
		);
	} );
} );

describe( 'hasAnyMatchingModule selector', () => {
	const buildState = ( searchTerm, items ) => ( {
		jetpack: {
			modules: { items },
			search: { searchTerm },
		},
	} );

	const items = {
		photon: {
			module: 'photon',
			name: 'Photon',
			description: 'Serve images from the WordPress.com CDN.',
		},
		protect: {
			module: 'protect',
			name: 'Protect',
			description: 'Prevent brute-force login attacks.',
		},
	};

	test( 'returns false when the search term is empty', () => {
		expect( hasAnyMatchingModule( buildState( '', items ) ) ).toBe( false );
	} );

	test( 'returns false when the modules state has not loaded yet', () => {
		expect( hasAnyMatchingModule( buildState( 'photon', undefined ) ) ).toBe( false );
	} );

	test( 'returns true when at least one module matches the search term', () => {
		expect( hasAnyMatchingModule( buildState( 'brute-force', items ) ) ).toBe( true );
	} );

	test( 'returns false when no module matches the search term', () => {
		expect( hasAnyMatchingModule( buildState( 'asdfqwerty', items ) ) ).toBe( false );
	} );
} );
