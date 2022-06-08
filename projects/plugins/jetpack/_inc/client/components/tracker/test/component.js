import { jest } from '@jest/globals';
import { mount } from 'enzyme';
import React from 'react';
import { Tracker } from '../index';

describe( 'Tracker component', () => {
	let tracker, analytics, theSpy;

	beforeAll( () => {
		theSpy = jest.fn();
		analytics = {
			tracks: {
				recordEvent: theSpy,
			},
		};
		tracker = mount( <Tracker analytics={ analytics } /> );
	} );

	describe( 'when nothing happens', () => {
		it( 'does not record anything', () => {
			expect( theSpy ).not.toHaveBeenCalled();
		} );
	} );

	describe( 'when a new search term appears', () => {
		beforeAll( () => {
			tracker.setProps( { searchTerm: 'new term' } );
		} );

		it( 'records a jetpack_wpa_search_term event', () => {
			expect( theSpy ).toHaveBeenCalledTimes( 1 );
			expect( theSpy ).toHaveBeenCalledWith( 'jetpack_wpa_search_term', { term: 'new term' } );
		} );
	} );
} );
