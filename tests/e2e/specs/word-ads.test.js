/**
 * Internal dependencies
 */
import BlockEditorPage from '../lib/pages/wp-admin/block-editor';
import PostFrontendPage from '../lib/pages/postFrontend';
import WordAdsBlock from '../lib/blocks/word-ads';
import { connectThroughJetpackStart } from '../lib/flows/jetpack-connect';
import { execShellCommand, resetWordpressInstall, getNgrokSiteUrl } from '../lib/utils-helper';
import { isEventuallyPresent } from '../lib/page-helper';

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
		await connectThroughJetpackStart();
		// Can activate WordAds module
		await activateWordAdsModule();
		await execShellCommand( 'wp option get wordads_approved --path="/home/travis/wordpress"' );

		await page.waitFor( 30000 );
		const blockEditor = await BlockEditorPage.visit( page );
		const blockInfo = await blockEditor.insertBlock( WordAdsBlock.name() );

		const adBlock = new WordAdsBlock( blockInfo, page );
		await adBlock.switchFormat( 3 ); // switch to Wide Skyscraper ad format

		await blockEditor.focus();

		await page.setCacheEnabled( false );
		await blockEditor.publishPost();
		await blockEditor.viewPost();

		let frontend = await PostFrontendPage.init( page );
		const url = page.url();
		await frontend.logout();

		await page._client.send( 'Network.clearBrowserCookies' );

		// await page.reload( { waitFor: 'networkidle0' } );

		frontend = await PostFrontendPage.visit( page, url );
		frontend.reloadUntil( async () => {
			const r = await execShellCommand(
				'wp option get jetpack_active_plan --path="/home/travis/wordpress"'
			);
			return typeof r === 'string' ? false : true;
		} );

		frontend.reloadUntil(
			async () => ! ( await isEventuallyPresent( page, '.entry-content iframe[src*="wordads"]' ) )
		);

		await frontend.isRenderedBlockPresent( WordAdsBlock );
	} );
} );
