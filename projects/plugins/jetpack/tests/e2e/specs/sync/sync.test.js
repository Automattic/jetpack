import { prerequisitesBuilder } from '_jetpack-e2e-commons/env/index.js';
import { test, expect } from '_jetpack-e2e-commons/fixtures/base-test.js';
import { execWpCommand } from '_jetpack-e2e-commons/helpers/utils-helper.js';
import logger from '_jetpack-e2e-commons/logger.js';
import {
	enableSync,
	disableSync,
	resetSync,
	enableDedicatedSync,
	disableDedicatedSync,
	isSyncQueueEmpty,
} from '../../helpers/sync-helper.js';
import playwrightConfig from '../../playwright.config.mjs';

test.describe( 'Sync', () => {
	const wpcomRestAPIBase = 'https://public-api.wordpress.com/rest/';
	let wpcomBlogId;
	let wpcomForcedPostsUrl;
	let wpcomPostsResponse;
	let wpcomPosts;

	test.beforeAll( async ( { browser } ) => {
		const page = await browser.newPage( playwrightConfig.use );
		await prerequisitesBuilder( page ).withLoggedIn( true ).withConnection( true ).build();
		await page.close();

		const jetpackOptions = await execWpCommand( 'option get jetpack_options --format=json' );
		wpcomBlogId = JSON.parse( jetpackOptions ).id;
		wpcomForcedPostsUrl =
			wpcomRestAPIBase + `v1/sites/${ wpcomBlogId }/posts?force=wpcom&search=Sync`;
		logger.sync( `START: ${ jetpackOptions }` );
	} );

	test.beforeEach( async () => {
		await test.step( 'Check sync queue status before test', async () => {
			await assertSyncQueueIsEmpty( 'Sync queue should be empty [before]' );
		} );
	} );

	test.afterEach( async () => {
		await test.step( 'Reset Sync defaults', async () => {
			await resetSync();
			await enableSync();
			await disableDedicatedSync();
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

			wpcomPostsResponse = await page.request.get( wpcomForcedPostsUrl );
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
			wpcomPostsResponse = await page.request.get( wpcomForcedPostsUrl );
			expect( wpcomPostsResponse.ok(), 'WPCOM get posts response is OK' ).toBeTruthy();

			wpcomPosts = await wpcomPostsResponse.json();
			expect(
				wpcomPosts.posts,
				'Previously created post should NOT be present in the synced posts'
			).toContainEqual(
				expect.not.objectContaining( {
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

			wpcomPostsResponse = await page.request.get( wpcomForcedPostsUrl );
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
	 * Assert sync queue is empty
	 * @param {string} message - Message to report.
	 * @param {number} timeout - Timeout.
	 */
	async function assertSyncQueueIsEmpty( message = 'Sync queue should be empty', timeout = 30000 ) {
		await expect
			.poll(
				async () => {
					return await isSyncQueueEmpty();
				},
				{
					message,
					timeout,
				}
			)
			.toBeTruthy();
	}
} );
