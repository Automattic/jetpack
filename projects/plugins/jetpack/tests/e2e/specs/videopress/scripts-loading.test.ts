import { test, expect } from '@automattic/_jetpack-e2e-commons/fixtures/base-test';
import logger from '@automattic/_jetpack-e2e-commons/logger';

/**
 * A real, publicly playable VideoPress video used purely for rendering checks.
 * The player falls back to a default embed even if its metadata can't be
 * fetched, so the test does not depend on the video data endpoint.
 */
const TEST_VIDEO_GUID = '3Nq0kSMu';

test.describe( 'VideoPress player script loading', () => {
	let postId: string;

	test.beforeAll( async ( { testUtils } ) => {
		await testUtils.activateModule( 'videopress' );

		/*
		 * Create a post with two VideoPress shortcodes so we can assert the
		 * shared player script is only loaded once for the whole page.
		 */
		const output = await testUtils.executeWpCommand( [
			'post',
			'create',
			'--post_type=post',
			'--post_status=publish',
			'--post_title=VideoPress script loading',
			`--post_content=[videopress ${ TEST_VIDEO_GUID }]\n\n[videopress ${ TEST_VIDEO_GUID }]`,
			'--porcelain',
		] );

		postId = output.match( /\d+/ )?.[ 0 ] ?? '';
		logger.debug( `Created VideoPress test post: ${ postId }` );
		expect( postId, 'wp-cli returned a post ID' ).toBeTruthy();
	} );

	test.afterAll( async ( { testUtils } ) => {
		if ( postId ) {
			await testUtils.executeWpCommand( [ 'post', 'delete', postId, '--force' ] );
		}
	} );

	test( 'loads the iframe API script only once for multiple videos', async ( { page } ) => {
		await page.goto( `/?p=${ postId }` );

		await test.step( 'Both videos render', async () => {
			const players = page.locator( `iframe[src*="videopress.com/embed/${ TEST_VIDEO_GUID }"]` );
			await expect( players ).toHaveCount( 2 );
			await expect( players.first() ).toBeVisible();
			await expect( players.last() ).toBeVisible();
		} );

		await test.step( 'The iframe API script is enqueued exactly once', async () => {
			const apiScript = page.locator( 'script[src*="videopress-iframe.js"]' );
			await expect( apiScript ).toHaveCount( 1 );

			// The "-js" id is only present when the script goes through wp_enqueue_script().
			await expect( page.locator( '#videopress-iframe-js' ) ).toBeAttached();
		} );
	} );
} );
