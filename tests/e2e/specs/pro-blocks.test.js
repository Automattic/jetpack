/**
 * Internal dependencies
 */
import BlockEditorPage from '../lib/pages/wp-admin/block-editor';
import PostFrontendPage from '../lib/pages/postFrontend';
import MailchimpBlock from '../lib/blocks/mailchimp';
import { syncJetpackPlanData } from '../lib/flows/jetpack-connect';
import { activateModule, execWpCommand } from '../lib/utils-helper';
import SimplePaymentBlock from '../lib/blocks/simple-payments';
import WordAdsBlock from '../lib/blocks/word-ads';
import { catchBeforeAll } from '../lib/setup-env';

describe( 'Paid blocks', () => {
	catchBeforeAll( async () => {
		await syncJetpackPlanData( 'pro' );

		await activateModule( page, 'publicize' );
		await activateModule( page, 'wordads' );
	} );

	afterAll( async () => {
		await execWpCommand( 'wp jetpack module deactivate publicize' );
		await execWpCommand( 'wp jetpack module deactivate wordads' );
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
			await blockEditor.waitForAvailableBlock( SimplePaymentBlock.name() );

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
			await blockEditor.waitForAvailableBlock( WordAdsBlock.name() );
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
} );
