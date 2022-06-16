import { mobile as mobileReducer } from '../reducer';

describe( 'Mobile reducer', () => {
	test( 'should default values to false or null', () => {
		const stateOut = mobileReducer( undefined, {} );
		expect( stateOut ).toHaveProperty( 'sendingLoginEmail', false );
		expect( stateOut ).toHaveProperty( 'loginEmailSent', false );
		expect( stateOut ).toHaveProperty( 'error', null );
	} );

	test( 'should update sendingLoginEmail to true when making a request', () => {
		const stateOut = mobileReducer( undefined, {
			type: 'JETPACK_MOBILE_LOGIN_SEND_LOGIN_EMAIL',
		} );
		expect( stateOut ).toHaveProperty( 'sendingLoginEmail', true );
		expect( stateOut ).toHaveProperty( 'loginEmailSent', false );
	} );

	test( 'should update sendingLoginEmail and loginEmailSent when returning successfully', () => {
		const stateOut = mobileReducer( undefined, {
			type: 'JETPACK_MOBILE_LOGIN_SEND_LOGIN_EMAIL_SUCCESS',
		} );
		expect( stateOut ).toHaveProperty( 'sendingLoginEmail', false );
		expect( stateOut ).toHaveProperty( 'loginEmailSent', true );
	} );

	test( 'should set an error message and update sendingLoginEmail and loginEmailSent when returning an error', () => {
		const stateOut = mobileReducer( undefined, {
			type: 'JETPACK_MOBILE_LOGIN_SEND_LOGIN_EMAIL_FAIL',
			error: {
				code: 'error_sending_mobile_magic_link',
				message: '403: Jetpack: [unauthorized_user] User is not able to use login link via email.',
				data: null,
			},
		} );

		expect( stateOut ).toHaveProperty( 'sendingLoginEmail', false );
		expect( stateOut ).toHaveProperty( 'loginEmailSent', false );
		expect( stateOut ).toHaveProperty( 'error' );
		expect( stateOut.error ).toHaveProperty( 'code', 'error_sending_mobile_magic_link' );
		expect( stateOut.error ).toHaveProperty(
			'message',
			'403: Jetpack: [unauthorized_user] User is not able to use login link via email.'
		);
		expect( stateOut.error ).toHaveProperty( 'data', null );
	} );
} );
