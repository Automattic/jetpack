import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { getLaunchSiteUrl } from './launch-site-url.ts';

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
