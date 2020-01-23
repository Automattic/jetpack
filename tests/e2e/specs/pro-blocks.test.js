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
import PinterestBlock from '../lib/blocks/pinterest';
import { syncPlanData } from '../lib/plan-helper';

describe( 'Paid blocks', () => {
	beforeAll( async () => {
		await resetWordpressInstall();
		const url = getNgrokSiteUrl();
		console.log( 'NEW SITE URL: ' + url );

		await connectThroughWPAdminIfNeeded( { mockPlanData: true } );

		await activateModule( 'wordads' );
		await activateModule( 'publicize' );

		await syncPlanData( page );
	} );

	describe( 'Mailchimp Block', () => {
		it( 'Can publish a post with a Mailchimp Block', async () => {
			const blockEditor = await BlockEditorPage.visit( page );
			const blockInfo = await blockEditor.insertBlock(
				MailchimpBlock.name(),
				MailchimpBlock.title()
			);

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
			const blockInfo = await blockEditor.insertBlock(
				SimplePaymentBlock.name(),
				SimplePaymentBlock.title()
			);

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
			// await blockEditor.waitForAvailableBlock( WordAdsBlock.name() );
			const blockInfo = await blockEditor.insertBlock( WordAdsBlock.name(), WordAdsBlock.title() );
			await blockEditor.focus();

			const adBlock = new WordAdsBlock( blockInfo, page );
			await adBlock.focus();
			await adBlock.switchFormat( 3 ); // switch to Wide Skyscraper ad format

			await blockEditor.focus();
			await blockEditor.publishPost();
			await blockEditor.viewPost();

			const frontend = await PostFrontendPage.init( page );
			await frontend.isRenderedBlockPresent( WordAdsBlock );
		} );
	} );

	describe( 'Pinterest block', () => {
		it( 'Can publish a post with a Pinterest block', async () => {
			const blockEditor = await BlockEditorPage.visit( page );
			const blockInfo = await blockEditor.insertBlock(
				PinterestBlock.name(),
				PinterestBlock.title()
			);

			const pinterestBlock = new PinterestBlock( blockInfo, page );
			await pinterestBlock.addEmbed();

			await blockEditor.focus();
			await blockEditor.publishPost();
			await blockEditor.viewPost();

			const frontend = await PostFrontendPage.init( page );
			await frontend.isRenderedBlockPresent( PinterestBlock );
		} );
	} );
} );
