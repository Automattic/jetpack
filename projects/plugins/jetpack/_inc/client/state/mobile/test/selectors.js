import {
	isSendingMobileLoginEmail,
	hasSentMobileLoginEmail,
	getMobileLoginEmailError,
} from '../reducer';

describe( 'mobile selectors', () => {
	describe( '#isSendingMobileLoginEmail', () => {
		test( 'should return false by default', () => {
			const output = isSendingMobileLoginEmail( {
				jetpack: {
					mobile: {},
				},
			} );
			expect( output ).toBe( false );
		} );

		test( 'should return false if sendingLoginEmail false', () => {
			const output = isSendingMobileLoginEmail( {
				jetpack: {
					mobile: {
						sendingLoginEmail: false,
					},
				},
			} );
			expect( output ).toBe( false );
		} );

		test( 'should return true if sendingLoginEmail true', () => {
			const output = isSendingMobileLoginEmail( {
				jetpack: {
					mobile: {
						sendingLoginEmail: true,
					},
				},
			} );
			expect( output ).toBe( true );
		} );
	} );

	describe( '#hasSentMobileLoginEmail', () => {
		test( 'should return false by default', () => {
			const output = hasSentMobileLoginEmail( {
				jetpack: {
					mobile: {},
				},
			} );
			expect( output ).toBe( false );
		} );

		test( 'should return false if sendingLoginEmail false', () => {
			const output = hasSentMobileLoginEmail( {
				jetpack: {
					mobile: {
						loginEmailSent: false,
					},
				},
			} );
			expect( output ).toBe( false );
		} );

		test( 'should return true if sendingLoginEmail true', () => {
			const output = hasSentMobileLoginEmail( {
				jetpack: {
					mobile: {
						loginEmailSent: true,
					},
				},
			} );
			expect( output ).toBe( true );
		} );
	} );

	describe( '#getMobileLoginEmailError', () => {
		test( 'should return false by default', () => {
			const output = getMobileLoginEmailError( {
				jetpack: {
					mobile: {},
				},
			} );
			expect( output ).toBeNull();
		} );

		test( 'should return error when set', () => {
			const output = getMobileLoginEmailError( {
				jetpack: {
					mobile: {
						error: {
							code: 'error_sending_mobile_magic_link',
							message:
								'403: Jetpack: [unauthorized_user] User is not able to use login link via email.',
							data: null,
						},
					},
				},
			} );
			expect( output ).toHaveProperty( 'code', 'error_sending_mobile_magic_link' );
			expect( output ).toHaveProperty(
				'message',
				'403: Jetpack: [unauthorized_user] User is not able to use login link via email.'
			);
			expect( output ).toHaveProperty( 'data', null );
		} );
	} );
} );
