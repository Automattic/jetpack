/**
 * External dependencies
 */
import React from 'react';
import { expect } from 'chai';
import { mount } from 'enzyme';
import { spy } from 'sinon';

/**
 * Internal dependencies
 */
import { Tracker } from '../index';

describe( 'Tracker component', () => {
	let tracker,
		analytics,
		theSpy;

	before( () => {
		theSpy = spy();
		analytics = {
			tracks: {
				recordEvent: theSpy
			}
		};
		tracker = mount( <Tracker analytics={ analytics } /> );
	} );

	describe( 'when nothing happens', () => {
		it( 'does not record anything', () => {
			expect( theSpy.called ).to.be.false;
		} );
	} );

	describe( 'when a new search term appears', () => {
		before( () => {
			tracker.setProps( { searchTerm: 'new term' } );
		} );

		it( 'records a jetpack_wpa_search_term event', () => {
			expect( theSpy.calledOnce ).to.be.true;
			expect( theSpy.args[ 0 ][ 0 ] ).to.equal( 'jetpack_wpa_search_term' );
			expect( theSpy.args[ 0 ][ 1 ] ).to.eql( { term: 'new term' } );
		} );
	} );
} );
