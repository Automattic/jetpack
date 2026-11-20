import { getProtectedOwnerConfirmationCopy } from '../copy';

describe( 'getProtectedOwnerConfirmationCopy', () => {
	it( 'returns the confirmation wording for a site', () => {
		const copy = getProtectedOwnerConfirmationCopy();

		expect( copy.title ).toBe( 'Confirm you are the site owner' );
		expect( copy.body ).toBe(
			'This WordPress.com account becomes the confirmed owner. The connection stays locked to this account.'
		);
		expect( copy.confirm ).toBe( 'Confirm' );
		expect( copy.cancel ).toBe( 'Cancel' );
		expect( copy.contactSupport ).toBe( 'Contact support' );
		expect( copy.confirmError ).toBe( 'Could not confirm the protected owner.' );
		expect( copy.supportUrl ).toContain( 'source=jetpack-support' );
	} );

	it( 'uses the subject the caller passed', () => {
		const copy = getProtectedOwnerConfirmationCopy( { subject: 'store' } );

		expect( copy.title ).toBe( 'Confirm you are the store owner' );
	} );
} );
