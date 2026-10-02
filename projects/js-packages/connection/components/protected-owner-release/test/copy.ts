import { getProtectedOwnerReleaseCopy } from '../copy';

describe( 'getProtectedOwnerReleaseCopy', () => {
	it( 'returns the release wording for a site', () => {
		const copy = getProtectedOwnerReleaseCopy();

		expect( copy.title ).toBe( 'Release ownership of this site' );
		expect( copy.body ).toBe(
			'Releasing ownership turns off features that require a confirmed owner. Any connected administrator will then be able to confirm ownership of this site.'
		);
		expect( copy.release ).toBe( 'Release ownership' );
		expect( copy.cancel ).toBe( 'Cancel' );
		expect( copy.contactSupport ).toBe( 'Contact support' );
		expect( copy.releaseError ).toBe( 'Could not release the protected owner.' );
		expect( copy.supportUrl ).toContain( 'source=jetpack-support' );
	} );

	it( 'uses the subject the caller passed', () => {
		const copy = getProtectedOwnerReleaseCopy( { subject: 'store' } );

		expect( copy.title ).toBe( 'Release ownership of this store' );
		expect( copy.body ).toContain( 'confirm ownership of this store.' );
	} );
} );
