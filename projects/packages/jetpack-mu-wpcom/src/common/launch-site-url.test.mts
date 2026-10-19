import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { getLaunchSiteUrl, withBackTo } from './launch-site-url.ts';

describe( 'getLaunchSiteUrl', () => {
	it( 'moves back_to onto the site host over https', () => {
		const url = new URL(
			getLaunchSiteUrl(
				'example.com',
				'http://example.wpcomstaging.com:8080/wp-admin/post.php?post=1&action=edit'
			)
		);

		assert.equal(
			url.searchParams.get( 'back_to' ),
			'https://example.com/wp-admin/post.php?post=1&action=edit'
		);
	} );
} );

describe( 'withBackTo', () => {
	it( 'replaces a back_to the server built before the page cleaned its URL', () => {
		const url = new URL(
			withBackTo(
				'https://wordpress.com/setup/launch-site?siteSlug=example.com&ref=wp-admin&back_to=https%3A%2F%2Fexample.com%2Fmy-post%2F%3Fwpcom_write_published%3D1',
				'https://example.com/my-post/'
			)
		);

		assert.deepEqual( url.searchParams.getAll( 'back_to' ), [ 'https://example.com/my-post/' ] );
		assert.equal( url.searchParams.get( 'ref' ), 'wp-admin' );
	} );
} );
