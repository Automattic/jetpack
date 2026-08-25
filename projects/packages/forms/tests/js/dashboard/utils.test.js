import { getFormEditUrl, getNewFormEditorUrl } from '../../../src/dashboard/utils';

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

describe( 'getNewFormEditorUrl', () => {
	it( 'returns a full URL when adminUrl is provided', () => {
		expect( getNewFormEditorUrl( undefined, 'https://example.com/wp-admin/' ) ).toBe(
			'https://example.com/wp-admin/post-new.php?post_type=jetpack_form'
		);
	} );

	it( 'returns a relative path when adminUrl is omitted', () => {
		expect( getNewFormEditorUrl() ).toBe( 'post-new.php?post_type=jetpack_form' );
	} );

	it( 'omits the title when there is nothing but whitespace', () => {
		expect( getNewFormEditorUrl( '   ', 'https://example.com/wp-admin/' ) ).toBe(
			'https://example.com/wp-admin/post-new.php?post_type=jetpack_form'
		);
	} );

	it( 'encodes the title so it survives the round trip', () => {
		expect( getNewFormEditorUrl( 'Tea & Coffee', 'https://example.com/wp-admin/' ) ).toBe(
			'https://example.com/wp-admin/post-new.php?post_type=jetpack_form&post_title=Tea%20%26%20Coffee'
		);
	} );
} );
