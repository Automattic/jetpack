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
import { catchBeforeAll, step } from '../lib/setup-env';

describe( 'Paid blocks', () => {
	catchBeforeAll( async () => {
		await syncJetpackPlanData( 'complete' );

		await activateModule( page, 'publicize' );
		await activateModule( page, 'wordads' );
	} );

	afterAll( async () => {
		await execWpCommand( 'wp jetpack module deactivate publicize' );
		await execWpCommand( 'wp jetpack module deactivate wordads' );
	} );

	it( 'MailChimp Block', async () => {
		let blockEditor;
		let blockInfo;

		await step( 'Can visit the block editor and add a MailChimp block', async () => {
			blockEditor = await BlockEditorPage.visit( page );
			blockInfo = await blockEditor.insertBlock( MailchimpBlock.name(), MailchimpBlock.title() );
		} );

		await step( 'Can connect to a MailChimp', async () => {
			const mcBlock = new MailchimpBlock( blockInfo, page );
			await mcBlock.connect();
		} );

		await step( 'Can publish a post and assert that MailChimp block is rendered', async () => {
			await blockEditor.focus();
			await blockEditor.publishPost();

			await blockEditor.viewPost();
			const frontend = await PostFrontendPage.init( page );
			expect( await frontend.isRenderedBlockPresent( MailchimpBlock ) ).toBeTruthy();
		} );
	} );

	it( 'Pay with PayPal', async () => {
		let blockEditor;
		let blockInfo;

		await step( 'Can visit the block editor and add a Pay with PayPal block', async () => {
			blockEditor = await BlockEditorPage.visit( page );
			await blockEditor.waitForAvailableBlock( SimplePaymentBlock.name() );

			blockInfo = await blockEditor.insertBlock(
				SimplePaymentBlock.name(),
				SimplePaymentBlock.title()
			);
		} );

		await step( 'Can fill details of Pay with PayPal block', async () => {
			const spBlock = new SimplePaymentBlock( blockInfo, page );
			await spBlock.fillDetails();
		} );

		await step(
			'Can publish a post and assert that Pay with PayPal block is rendered',
			async () => {
				await blockEditor.focus();
				await blockEditor.publishPost();
				await blockEditor.viewPost();

				const frontend = await PostFrontendPage.init( page );
				expect( await frontend.isRenderedBlockPresent( SimplePaymentBlock ) ).toBeTruthy();
			}
		);
	} );

	it( 'WordAds block', async () => {
		let blockEditor;
		let blockInfo;

		await step( 'Can visit the block editor and add a WordAds block', async () => {
			blockEditor = await BlockEditorPage.visit( page );
			await blockEditor.waitForAvailableBlock( WordAdsBlock.name() );
			blockInfo = await blockEditor.insertBlock( WordAdsBlock.name(), WordAdsBlock.title() );
			await blockEditor.focus();
		} );

		await step( 'Can switch to Wide Skyscraper ad format', async () => {
			const adBlock = new WordAdsBlock( blockInfo, page );
			await adBlock.focus();
			await adBlock.switchFormat( 4 ); // switch to Wide Skyscraper ad format
		} );

		await step( 'Can publish a post and assert that WordAds block is rendered', async () => {
			await blockEditor.focus();
			await blockEditor.publishPost();
			await blockEditor.viewPost();

			const frontend = await PostFrontendPage.init( page );
			expect( await frontend.isRenderedBlockPresent( WordAdsBlock ) ).toBeTruthy();
		} );
	} );
} );
