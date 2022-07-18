import { jest } from '@jest/globals';
import React from 'react';
import { render } from 'test/test-utils';
import { UnwrappedComponent as SubscriptionsComponent } from '../subscriptions';

// Mock settings card. It does a lot of stuff in the background that we don't care about for these tests.
jest.mock( 'components/settings-card', () => ( {
	__esModule: true,
	default: () => <div>settings-card</div>,
} ) );

describe( 'SubscriptionsComponent', () => {
	const theSpy = jest.fn();
	const props = {
		getOptionValue: theSpy,
		getModule: () => {
			return {
				description: 'Bogus module.',
			};
		},
		isUnavailableInOfflineMode: () => {},
		isSavingAnyOption: () => {},
	};

	beforeEach( () => {
		theSpy.mockClear();
	} );

	describe( 'initial state', () => {
		it( 'queries getOptionValue', () => {
			render( <SubscriptionsComponent { ...props } /> );
			expect( theSpy ).toHaveBeenCalledTimes( 3 );
		} );

		it( 'does not pass the second argument to getOptionValue', () => {
			render( <SubscriptionsComponent { ...props } /> );
			expect( theSpy.mock.calls[ 1 ][ 1 ] ).toBeUndefined();
			expect( theSpy.mock.calls[ 2 ][ 1 ] ).toBeUndefined();
		} );

		it( 'gets certain option values from getOptionValue', () => {
			render( <SubscriptionsComponent { ...props } /> );
			expect( theSpy ).toHaveBeenCalledWith( 'stb_enabled' );
			expect( theSpy ).toHaveBeenCalledWith( 'stc_enabled' );
		} );
	} );
} );
