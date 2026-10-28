import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { getDestination } from './get-destination.ts';

const site = {
	origin: 'https://example.wordpress.com',
	domain: 'example.com',
	adminPath: '/wp-admin/',
};

const cases: [ string, string | undefined ][] = [
	[ 'https://example.wordpress.com/wp-admin/post.php?post=123&action=edit', 'post.php' ],
	[ 'https://example.wordpress.com/wp-admin/admin.php?page=stats&tab=x', 'admin.php?page=stats' ],
	[
		'https://example.wordpress.com/wp-admin/post-new.php?post_type=page',
		'post-new.php?post_type=page',
	],
	[ 'https://example.wordpress.com/wp-admin/', 'index.php' ],
	[ 'https://example.wordpress.com/2026/10/a-post-title/', 'site' ],
	[ 'https://example.com/2026/10/a-post-title/?preview=true', 'site' ],
	[ 'https://wordpress.com/post/example.com/123?ref=x#top', 'wordpress.com/post/:site/:id' ],
	[
		'https://jetpack.com/redirect/?source=subscribers&site=example.com',
		'jetpack.com/redirect?source=subscribers',
	],
	[ 'mailto:someone@example.com', 'mailto:' ],
	[ 'not a url', undefined ],
];

describe( 'getDestination', () => {
	for ( const [ href, expected ] of cases ) {
		it( `reduces ${ href } to ${ expected }`, () => {
			assert.equal( getDestination( href, site ), expected );
		} );
	}
} );
