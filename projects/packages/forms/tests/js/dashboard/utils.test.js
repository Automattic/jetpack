import { getFormEditUrl } from '../../../src/dashboard/utils';

describe( 'getFormEditUrl', () => {
	it( 'returns a full URL when adminUrl is provided', () => {
		expect( getFormEditUrl( 123, 'https://example.com/wp-admin/' ) ).toBe(
			'https://example.com/wp-admin/post.php?post=123&action=edit'
		);
	} );

	it( 'returns a relative path when adminUrl is omitted', () => {
		expect( getFormEditUrl( 123 ) ).toBe( 'post.php?post=123&action=edit' );
	} );

	it( 'does not include post_type parameter', () => {
		expect( getFormEditUrl( 456, 'https://example.com/wp-admin/' ) ).not.toContain( 'post_type' );
	} );
} );
