/**
 * WordPress dependencies
 */
import { createNewPost } from '@wordpress/e2e-test-utils/build/create-new-post';
/**
 * Internal dependencies
 */
import BlockEditorPage from '../lib/pages/wp-admin/block-editor';
import PostFrontendPage from '../lib/pages/postFrontend';
import WordAdsBlock from '../lib/blocks/word-ads';
import { connectThroughWPAdminIfNeeded } from '../lib/flows/jetpack-connect';

/**
 * Executes a shell command and return it as a Promise.
 * @param {string} cmd  shell command
 * @return {Promise<string>} output
 */
function execShellCommand( cmd ) {
	const exec = require( 'child_process' ).exec;
	return new Promise( resolve => {
		exec( cmd, ( error, stdout, stderr ) => {
			if ( error ) {
				console.warn( error );
			}
			resolve( stdout ? stdout : stderr );
		} );
	} );
}

// Activate WordAds module if in CI
beforeAll( async () => {
	let cmd =
		'docker-compose -f ./tests/e2e/bin/docker-compose.yml run --rm -u 33 cli_e2e_tests wp jetpack module activate wordads';
	if ( process.env.CI ) {
		cmd = 'wp jetpack module activate wordads --path="/home/travis/wordpress"';
	}

	const out = await execShellCommand( cmd );
	console.log( out );
} );

describe( 'WordAds block', () => {
	it( 'Can login and connect Jetpack if needed', async () => {
		await connectThroughWPAdminIfNeeded();
	} );

	it( 'Can publish a post with a WordAds block', async () => {
		await createNewPost();

		const blockEditor = await BlockEditorPage.init( page );
		const blockInfo = await blockEditor.insertBlock( WordAdsBlock.name() );

		const adBlock = new WordAdsBlock( blockInfo, page );
		await adBlock.switchFormat( 3 ); // switch to Wide Skyscraper ad format

		await blockEditor.focus();

		await blockEditor.publishPost();
		await blockEditor.viewPost();

		const frontend = await PostFrontendPage.init( page );
		await frontend.isRenderedBlockPresent( WordAdsBlock );
	} );
} );
