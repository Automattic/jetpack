/**
 * Internal dependencies
 */
import BlockEditorPage from '../lib/pages/wp-admin/block-editor';
import PostFrontendPage from '../lib/pages/postFrontend';
import WordAdsBlock from '../lib/blocks/word-ads';
import {
	connectThroughWPAdminIfNeeded,
	connectThroughJetpackStart,
} from '../lib/flows/jetpack-connect';
import { execShellCommand, resetWordpressInstall, getNgrokSiteUrl } from '../lib/utils-helper';

// Activate WordAds module if in CI
async function activateWordAdsModule() {
	let cmd = './tests/e2e/docker/whatever.sh cli "wp jetpack module activate wordads"';
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
		// await connectThroughWPAdminIfNeeded();
		await connectThroughJetpackStart();

		// Can activate WordAds module
		await activateWordAdsModule();

		await page.waitFor( 5000 ); // Trying to wait for plan data to be updated
		await page.reload( { waitFor: 'networkidle0' } );

		const blockEditor = await BlockEditorPage.visit( page );
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
