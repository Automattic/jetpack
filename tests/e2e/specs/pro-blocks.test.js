/**
 * Internal dependencies
 */
import BlockEditorPage from '../lib/pages/wp-admin/block-editor';
import PostFrontendPage from '../lib/pages/postFrontend';
import MailchimpBlock from '../lib/blocks/mailchimp';
import { connectThroughWPAdminIfNeeded } from '../lib/flows/jetpack-connect';
import { resetWordpressInstall, getNgrokSiteUrl, activateModule } from '../lib/utils-helper';
import SimplePaymentBlock from '../lib/blocks/simple-payments';
import WordAdsBlock from '../lib/blocks/word-ads';

describe( 'Paid blocks', () => {
	beforeAll( async () => {
		await resetWordpressInstall();
		const url = getNgrokSiteUrl();
		console.log( 'NEW SITE URL: ' + url );

		await connectThroughWPAdminIfNeeded();

		await activateModule( 'wordads' );
		await activateModule( 'publicize' );

		await page.waitFor( 10000 ); // Trying to wait for plan data to be updated
		await page.reload( { waitFor: 'networkidle0' } );
	} );

	describe( 'Mailchimp Block', () => {
		it( 'Can publish a post with a Mailchimp Block', async () => {
			const blockEditor = await BlockEditorPage.visit( page );
			const blockInfo = await blockEditor.insertBlock( MailchimpBlock.name() );

			const mcBlock = new MailchimpBlock( blockInfo, page );
			await mcBlock.connect();

			await blockEditor.focus();
			await blockEditor.publishPost();

			await blockEditor.viewPost();
			const frontend = await PostFrontendPage.init( page );
			await frontend.isRenderedBlockPresent( MailchimpBlock );
		} );
	} );

	describe( 'Simple Payment', () => {
		it( 'Can publish a post with a Simple Payments block', async () => {
			const blockEditor = await BlockEditorPage.visit( page );
			const blockInfo = await blockEditor.insertBlock( SimplePaymentBlock.name() );

			const spBlock = new SimplePaymentBlock( blockInfo, page );
			await spBlock.fillDetails();

			await blockEditor.focus();
			await blockEditor.publishPost();
			await blockEditor.viewPost();

			const frontend = await PostFrontendPage.init( page );
			await frontend.isRenderedBlockPresent( SimplePaymentBlock );
		} );
	} );

	describe( 'WordAds block', () => {
		it( 'Can publish a post with a WordAds block', async () => {
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
} );
