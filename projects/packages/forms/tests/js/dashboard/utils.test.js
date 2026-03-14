import { getFormEditUrl } from '../../../src/dashboard/utils';

describe( 'getFormEditUrl', () => {
	it( 'returns the correct edit URL for a given form ID', () => {
		expect( getFormEditUrl( 123 ) ).toBe( 'post.php?post=123&action=edit' );
	} );

	it( 'does not include post_type parameter', () => {
		expect( getFormEditUrl( 456 ) ).not.toContain( 'post_type' );
	} );
} );
