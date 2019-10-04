/**
 * Internal dependencies
 */
import BlockEditorPage from '../lib/pages/wp-admin/block-editor';
import PostFrontendPage from '../lib/pages/postFrontend';
import WordAdsBlock from '../lib/blocks/word-ads';
import { connectThroughWPAdminIfNeeded } from '../lib/flows/jetpack-connect';
import { execShellCommand, resetWordpressInstall, getNgrokSiteUrl } from '../lib/utils-helper';
import Sidebar from '../lib/pages/wp-admin/sidebar';

// Activate WordAds module if in CI
async function activateWordAdsModule() {
	let cmd =
		'docker-compose -f ./tests/e2e/bin/docker-compose.yml run --rm -u 33 cli_e2e_tests wp jetpack module activate wordads';
	if ( process.env.CI ) {
		cmd = 'wp jetpack module activate wordads --path="/home/travis/wordpress"';
	}

	await execShellCommand( cmd );
}

describe( 'WordAds block', () => {
	beforeAll( async () => {
		await resetWordpressInstall();
		const url = getNgrokSiteUrl();
		console.log( 'NEW SITE URL: ' + url );
	} );

	it( 'Can publish a post with a WordAds block', async () => {
		// Can login and connect Jetpack if needed
		await connectThroughWPAdminIfNeeded();
		// Can activate WordAds module
		await activateWordAdsModule();

		// await ( await Sidebar.init( page ) ).selectNewPost();
		const blockEditor = await BlockEditorPage.visit( page );

		// const blockEditor = await BlockEditorPage.init( page );
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
