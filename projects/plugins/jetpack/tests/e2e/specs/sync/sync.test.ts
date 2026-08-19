import { test, expect } from '@automattic/_jetpack-e2e-commons/fixtures/base-test';
import logger from '@automattic/_jetpack-e2e-commons/logger';
import {
	enableSync,
	disableSync,
	resetSync,
	resetSyncLocks,
	getSyncStatus,
	enableDedicatedSync,
	disableDedicatedSync,
} from '../../helpers/sync-helper';

test.describe( 'Sync', () => {
	const wpcomRestAPIBase = 'https://public-api.wordpress.com/rest/';
	let wpcomBlogId: number;
	let wpcomPostsResponse;
	let wpcomPosts;

	test.beforeAll( async ( { testUtils } ) => {
		const jetpackOptions = await testUtils.executeWpCommand(
			'option get jetpack_options --format=json'
		);
		wpcomBlogId = JSON.parse( jetpackOptions ).id;
		logger.debug( `START: ${ jetpackOptions }` );
	} );

	test.beforeEach( async () => {
		await test.step( 'Reset Sync defaults before test', async () => {
			await resetSyncDefaults();
			await assertSyncQueueIsEmpty( 'Sync queue should be empty [before]' );
		} );
	} );

	test.afterEach( async () => {
		await test.step( 'Reset Sync defaults', async () => {
			await resetSyncDefaults();
			await assertSyncQueueIsEmpty( 'Sync queue should be empty [after cleanup]' );
		} );
	} );

	test( 'Normal Sync flow', async ( { admin, editor, page } ) => {
		const title = `Normal Sync ${ Date.now() }`;

		await test.step( 'Publish a post', async () => {
			await admin.createNewPost( { title } );
			const postId = await editor.publishPost();

			// Visit the post
			await page.goto( `/?p=${ postId }` );
		} );

		await test.step( 'Assert post is synced', async () => {
			await assertSyncQueueIsEmpty( 'Sync queue should be empty [after post publish]' );

			wpcomPostsResponse = await page.request.get( getWpcomForcedPostsUrl( title ) );
			expect( wpcomPostsResponse.ok(), 'WPCOM get posts response is OK' ).toBeTruthy();

			wpcomPosts = await wpcomPostsResponse.json();
			expect(
				wpcomPosts.posts,
				'Previously created post should be present in the synced posts'
			).toContainEqual(
				expect.objectContaining( {
					title,
				} )
			);
		} );
	} );

	test( 'Disabled Sync Flow', async ( { admin, editor, page } ) => {
		await test.step( 'Disabled Sync', async () => {
			const syncDisabled = await disableSync();
			expect( syncDisabled ).toMatch( 'Sync Disabled' );
		} );

		const title = `Disabled Sync ${ Date.now() }`;

		await test.step( 'Publish a post', async () => {
			await admin.createNewPost( { title } );
			const postId = await editor.publishPost();

			// Visit the post
			await page.goto( `/?p=${ postId }` );
		} );

		await test.step( 'Assert post is not synced', async () => {
			wpcomPostsResponse = await page.request.get( getWpcomForcedPostsUrl( title ) );
			expect( wpcomPostsResponse.ok(), 'WPCOM get posts response is OK' ).toBeTruthy();

			wpcomPosts = await wpcomPostsResponse.json();
			expect(
				wpcomPosts.posts,
				'Previously created post should NOT be present in the synced posts'
			).not.toContainEqual(
				expect.objectContaining( {
					title,
				} )
			);
		} );
	} );

	test( 'Dedicated Sync Flow', async ( { admin, editor, page } ) => {
		await test.step( 'Enable Dedicated Sync', async () => {
			const dedicatedSyncEnabled = await enableDedicatedSync();
			expect( dedicatedSyncEnabled ).toMatch( 'Success' );
		} );

		const title = `Dedicated Sync ${ Date.now() }`;

		await test.step( 'Publish a post', async () => {
			await admin.createNewPost( { title } );
			const postId = await editor.publishPost();

			// Visit the post
			await page.goto( `/?p=${ postId }` );
		} );

		await test.step( 'Assert post is synced', async () => {
			await assertSyncQueueIsEmpty( 'Sync queue should be empty [after post publish]' );

			wpcomPostsResponse = await page.request.get( getWpcomForcedPostsUrl( title ) );
			expect( wpcomPostsResponse.ok(), 'WPCOM get posts response is OK' ).toBeTruthy();

			wpcomPosts = await wpcomPostsResponse.json();
			expect(
				wpcomPosts.posts,
				'Previously created post should be present in the synced posts'
			).toContainEqual(
				expect.objectContaining( {
					title,
				} )
			);
		} );
	} );

	/**
	 * Reset Sync state before or after a test.
	 */
	async function resetSyncDefaults() {
		await resetSync();
		await resetSyncLocks();
		await disableDedicatedSync();
		await enableSync();
	}

	/**
	 * Build the WPCOM forced posts URL for a unique post title.
	 *
	 * @param {string} title - Post title to search for.
	 * @return {string} WPCOM forced posts URL.
	 */
	function getWpcomForcedPostsUrl( title: string ) {
		return (
			wpcomRestAPIBase +
			`v1/sites/${ wpcomBlogId }/posts?force=wpcom&search=${ encodeURIComponent( title ) }`
		);
	}

	/**
	 * Assert sync queue is empty.
	 *
	 * @param {string} message - Failure message.
	 * @param {number} timeout - Timeout in milliseconds.
	 */
	async function assertSyncQueueIsEmpty( message = 'Sync queue should be empty', timeout = 30000 ) {
		await expect
			.poll(
				async () => {
					try {
						return await getSyncStatus();
					} catch ( e ) {
						logger.error( `assertSyncQueueIsEmpty: ${ e }` );
						return '';
					}
				},
				{
					message,
					timeout,
				}
			)
			.toMatch( /(^|\n)queue_size\s+0(\n|$)/ );
	}
} );
