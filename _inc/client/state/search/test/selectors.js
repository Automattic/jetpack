import { expect } from 'chai';

import { isModuleFound } from '../index';

describe( 'Module found selector', () => {
	let state = {};

	before( () => {
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
							feature: 'Some modules do not have it, can you believe it?'
						}
					}
				},
				search: {
					searchTerm: ''
				}
			}
		}
	} );

	describe( 'when there is no search term', () => {
		it( 'returns true for every module', () => {
			expect( isModuleFound( state, 'photon' ) ).to.be.true;
		} );
		it( 'returns false for modules that do not exist', () => {
			expect( isModuleFound( state, 'make-everything-fast' ) ).to.be.false;
			expect( isModuleFound( state, 'take-over-the-world' ) ).to.be.false;
		} );
	} );

	describe( 'for an existing module', () => {
		[
			'photon',
			'Description',
			'Learn',
			'Long',
			'Terms',
			'TeRMs', // case sensitivity test
			'quer',
			'surprise',
			'believe'
		].map( function( term ) {
			describe( 'for the term ' + term, () => {
				it( 'should match', () => {
					state.jetpack.search.searchTerm = term;

					expect( isModuleFound( state, 'photon' ) ).to.be.true;
				} );
			} );
		} );

		[
			'nonexistent-slug',
			'Decscripton',
			'Hocus Pocus',
			'something else'
		].map( function( term ) {
			describe( 'for the term ' + term, () => {
				it( 'should not match', () => {
					state.jetpack.search.searchTerm = term;

					expect( isModuleFound( state, 'photon' ) ).to.be.false;
				} );
			} );
		} );
	} );
} );
