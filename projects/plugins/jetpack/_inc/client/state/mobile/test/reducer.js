import { expect } from 'chai';

import {
	mobile as mobileReducer
} from '../reducer';

describe( 'Mobile reducer', () => {
	it( 'should default values to false or null', () => {
		const stateOut = mobileReducer( undefined, {} );
		expect( stateOut ).to.have.property( 'sendingLoginEmail', false );
		expect( stateOut ).to.have.property( 'loginEmailSent', false );
		expect( stateOut ).to.have.property( 'error', null );
	} );

	it( 'should update sendingLoginEmail to true when making a request', () => {
		const stateOut = mobileReducer( undefined, {
			type: 'JETPACK_MOBILE_LOGIN_SEND_LOGIN_EMAIL',
		} );
		expect( stateOut ).to.have.property( 'sendingLoginEmail', true );
		expect( stateOut ).to.have.property( 'loginEmailSent', false );
	} );

	it( 'should update sendingLoginEmail and loginEmailSent when returning successfully', () => {
		const stateOut = mobileReducer( undefined, {
			type: 'JETPACK_MOBILE_LOGIN_SEND_LOGIN_EMAIL_SUCCESS',
		} );
		expect( stateOut ).to.have.property( 'sendingLoginEmail', false );
		expect( stateOut ).to.have.property( 'loginEmailSent', true );
	} );

	it( 'should set an error message and update sendingLoginEmail and loginEmailSent when returning an error', () => {
		const stateOut = mobileReducer( undefined, {
			type: 'JETPACK_MOBILE_LOGIN_SEND_LOGIN_EMAIL_FAIL',
			error: {
				code: 'error_sending_mobile_magic_link',
				message: '403: Jetpack: [unauthorized_user] User is not able to use login link via email.',
				data: null
			}
		} );

		expect( stateOut ).to.have.property( 'sendingLoginEmail', false );
		expect( stateOut ).to.have.property( 'loginEmailSent', false );
		expect( stateOut ).to.have.property( 'error' );
		expect( stateOut.error ).to.have.property( 'code', 'error_sending_mobile_magic_link' );
		expect( stateOut.error ).to.have.property( 'message', '403: Jetpack: [unauthorized_user] User is not able to use login link via email.' );
		expect( stateOut.error ).to.have.property( 'data', null );
	} );
} );
