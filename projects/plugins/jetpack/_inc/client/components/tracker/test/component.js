import { jest } from '@jest/globals';
import React from 'react';
import { render } from 'test/test-utils';
import { Tracker } from '../index';

describe( 'Tracker component', () => {
	const theSpy = jest.fn();
	const analytics = {
		tracks: {
			recordEvent: theSpy,
		},
	};

	beforeEach( () => {
		theSpy.mockClear();
	} );

	describe( 'when nothing happens', () => {
		it( 'does not record anything', () => {
			render( <Tracker analytics={ analytics } /> );
			expect( theSpy ).not.toHaveBeenCalled();
		} );
	} );

	describe( 'when a new search term appears', () => {
		it( 'records a jetpack_wpa_search_term event', () => {
			const { rerender } = render( <Tracker analytics={ analytics } /> );
			rerender( <Tracker analytics={ analytics } searchTerm="new term" /> );
			expect( theSpy ).toHaveBeenCalledTimes( 1 );
			expect( theSpy ).toHaveBeenCalledWith( 'jetpack_wpa_search_term', { term: 'new term' } );
		} );
	} );
} );
