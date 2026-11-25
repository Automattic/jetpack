import { getReloadUrl } from '../navigate';

describe( 'getReloadUrl', () => {
	it.each( [
		[
			'drops the admin bar link arguments',
			'https://example.com/wp-admin/edit.php?post_type=page&jetpack_idc_clear_confirmation=1&_wpnonce=abc#top',
			'https://example.com/wp-admin/edit.php?post_type=page#top',
		],
		[
			'keeps any other address as it is',
			'https://example.com/wp-admin/edit.php?s=a%20b#top',
			'https://example.com/wp-admin/edit.php?s=a%20b#top',
		],
	] )( '%s', ( _, href, expected ) => {
		expect( getReloadUrl( href ) ).toBe( expected );
	} );
} );
