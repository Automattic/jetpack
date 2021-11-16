/**
 * External dependencies
 */
import React from 'react';
import { expect } from 'chai';
import { shallow } from 'enzyme';
import { spy } from 'sinon';

/**
 * Internal dependencies
 */
import { UnwrappedComponent as SubscriptionsComponent } from '../subscriptions';

describe( 'SubscriptionsComponent', () => {
	let theSpy, props;

	before( () => {
		theSpy = spy(),
		props = {
			getOptionValue: theSpy,
			getModule: () => {
				return {
					description: 'Bogus module.'
				};
			},
			isUnavailableInOfflineMode: () => {},
			isSavingAnyOption: () => {}
		};
		shallow( <SubscriptionsComponent { ...props } /> );
	} );

	describe( 'initial state', () => {
		it( 'queries getOptionValue', () => {
			expect( theSpy.calledThrice ).to.be.true;
		} );
		it( 'does not pass the second argument to getOptionValue', () => {
			expect( theSpy.getCall( 1 ).args[ 1 ] ).to.be.undefined;
			expect( theSpy.getCall( 2 ).args[ 1 ] ).to.be.undefined;
		} );
		it( 'gets certain option values from getOptionValue', () => {
			expect( theSpy.calledWith( 'stb_enabled' ) ).to.be.true;
			expect( theSpy.calledWith( 'stc_enabled' ) ).to.be.true;
		} );
	} );
} );
