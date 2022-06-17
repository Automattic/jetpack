import { jest } from '@jest/globals';
import { shallow } from 'enzyme';
import React from 'react';
import { UnwrappedComponent as SubscriptionsComponent } from '../subscriptions';

describe( 'SubscriptionsComponent', () => {
	let theSpy, props;

	beforeAll( () => {
		( theSpy = jest.fn() ),
			( props = {
				getOptionValue: theSpy,
				getModule: () => {
					return {
						description: 'Bogus module.',
					};
				},
				isUnavailableInOfflineMode: () => {},
				isSavingAnyOption: () => {},
			} );
		shallow( <SubscriptionsComponent { ...props } /> );
	} );

	describe( 'initial state', () => {
		it( 'queries getOptionValue', () => {
			expect( theSpy ).toHaveBeenCalledTimes( 3 );
		} );
		it( 'does not pass the second argument to getOptionValue', () => {
			expect( theSpy.mock.calls[ 1 ][ 1 ] ).toBeUndefined();
			expect( theSpy.mock.calls[ 2 ][ 1 ] ).toBeUndefined();
		} );
		it( 'gets certain option values from getOptionValue', () => {
			expect( theSpy ).toHaveBeenCalledWith( 'stb_enabled' );
			expect( theSpy ).toHaveBeenCalledWith( 'stc_enabled' );
		} );
	} );
} );
