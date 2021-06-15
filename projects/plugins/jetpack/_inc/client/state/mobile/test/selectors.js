import { expect } from 'chai';

import {
	isSendingMobileLoginEmail,
	hasSentMobileLoginEmail,
	getMobileLoginEmailError
} from '../reducer';

let state = {
	jetpack: {}
};

describe( 'mobile selectors', () => {
	describe( '#isSendingMobileLoginEmail', () => {
		it( 'should return false by default', () => {
			const output = isSendingMobileLoginEmail( {
				jetpack: {
					mobile: {}
				}
			} );
			expect( output ).to.be.false;
		} );

		it( 'should return false if sendingLoginEmail false', () => {
			const output = isSendingMobileLoginEmail( {
				jetpack: {
					mobile: {
						sendingLoginEmail: false,
					}
				}
			} );
			expect( output ).to.be.false;
		} );

		it( 'should return true if sendingLoginEmail true', () => {
			const output = isSendingMobileLoginEmail( {
				jetpack: {
					mobile: {
						sendingLoginEmail: true,
					}
				}
			} );
			expect( output ).to.be.true;
		} );
	} );

	describe( '#hasSentMobileLoginEmail', () => {
		it( 'should return false by default', () => {
			const output = hasSentMobileLoginEmail( {
				jetpack: {
					mobile: {}
				}
			} );
			expect( output ).to.be.false;
		} );

		it( 'should return false if sendingLoginEmail false', () => {
			const output = hasSentMobileLoginEmail( {
				jetpack: {
					mobile: {
						loginEmailSent: false,
					}
				}
			} );
			expect( output ).to.be.false;
		} );

		it( 'should return true if sendingLoginEmail true', () => {
			const output = hasSentMobileLoginEmail( {
				jetpack: {
					mobile: {
						loginEmailSent: true,
					}
				}
			} );
			expect( output ).to.be.true;
		} );
	} );

	describe( '#getMobileLoginEmailError', () => {
		it( 'should return false by default', () => {
			const output = getMobileLoginEmailError( {
				jetpack: {
					mobile: {}
				}
			} );
			expect( output ).to.be.null;
		} );

		it( 'should return error when set', () => {
			const output = getMobileLoginEmailError( {
				jetpack: {
					mobile: {
						error: {
							code: 'error_sending_mobile_magic_link',
							message: '403: Jetpack: [unauthorized_user] User is not able to use login link via email.',
							data: null
						}
					}
				}
			} );
			expect( output ).to.have.property( 'code', 'error_sending_mobile_magic_link' );
			expect( output ).to.have.property( 'message', '403: Jetpack: [unauthorized_user] User is not able to use login link via email.' );
			expect( output ).to.have.property( 'data', null );
		} );
	} );
} )
