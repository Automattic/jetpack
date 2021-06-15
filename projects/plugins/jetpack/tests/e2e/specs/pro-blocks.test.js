import BlockEditorPage from '../lib/pages/wp-admin/block-editor';
import PostFrontendPage from '../lib/pages/postFrontend';
import MailchimpBlock from '../lib/pages/wp-admin/blocks/mailchimp';
import { syncJetpackPlanData } from '../lib/flows/jetpack-connect';
import { activateModule, execMultipleWpCommands } from '../lib/utils-helper';
import SimplePaymentBlock from '../lib/pages/wp-admin/blocks/simple-payments';
import WordAdsBlock from '../lib/pages/wp-admin/blocks/word-ads';
import { step } from '../lib/env/test-setup';

/**
 *
 * @group post-connection
 * @group pro-blocks
 * @group blocks
 * @group gutenberg
 */
describe( 'Paid blocks', () => {
	let blockEditor;

	beforeAll( async () => {
		await syncJetpackPlanData( 'complete' );
		await activateModule( page, 'publicize' );
		await activateModule( page, 'wordads' );
	} );

	beforeEach( async () => {
		blockEditor = await BlockEditorPage.visit( page );
		await blockEditor.resolveWelcomeGuide( false );
	} );

	afterAll( async () => {
		await execMultipleWpCommands(
			'wp jetpack module deactivate publicize',
			'wp jetpack module deactivate wordads'
		);
	} );

	it( 'MailChimp Block', async () => {
		let blockId;

		await step( 'Can visit the block editor and add a MailChimp block', async () => {
			blockId = await blockEditor.insertBlock( MailchimpBlock.name(), MailchimpBlock.title() );
		} );

		await step( 'Can connect to a MailChimp', async () => {
			const mcBlock = new MailchimpBlock( blockId, page );
			await mcBlock.connect();
		} );

		await step( 'Can publish a post and assert that MailChimp block is rendered', async () => {
			await blockEditor.selectPostTitle();
			await blockEditor.publishPost();
			await blockEditor.viewPost();
			const frontend = await PostFrontendPage.init( page );
			expect( await frontend.isRenderedBlockPresent( MailchimpBlock ) ).toBeTruthy();
		} );
	} );

	it( 'Pay with PayPal', async () => {
		let blockId;

		await step( 'Can visit the block editor and add a Pay with PayPal block', async () => {
			await blockEditor.waitForAvailableBlock( SimplePaymentBlock.name() );

			blockId = await blockEditor.insertBlock(
				SimplePaymentBlock.name(),
				SimplePaymentBlock.title()
			);
		} );

		await step( 'Can fill details of Pay with PayPal block', async () => {
			const spBlock = new SimplePaymentBlock( blockId, page );
			await spBlock.fillDetails();
		} );

		await step(
			'Can publish a post and assert that Pay with PayPal block is rendered',
			async () => {
				await blockEditor.selectPostTitle();
				await blockEditor.publishPost();
				await blockEditor.viewPost();
				const frontend = await PostFrontendPage.init( page );
				expect( await frontend.isRenderedBlockPresent( SimplePaymentBlock ) ).toBeTruthy();
			}
		);
	} );

	it( 'WordAds block', async () => {
		let blockId;

		await step( 'Can visit the block editor and add a WordAds block', async () => {
			await blockEditor.waitForAvailableBlock( WordAdsBlock.name() );
			blockId = await blockEditor.insertBlock( WordAdsBlock.name(), WordAdsBlock.title() );
			await blockEditor.selectPostTitle();
		} );

		await step( 'Can switch to Wide Skyscraper ad format', async () => {
			const adBlock = new WordAdsBlock( blockId, page );
			await adBlock.focus();
			await adBlock.switchFormat( 4 ); // switch to Wide Skyscraper ad format
		} );

		await step( 'Can publish a post and assert that WordAds block is rendered', async () => {
			await blockEditor.selectPostTitle();
			await blockEditor.publishPost();
			await blockEditor.viewPost();

			const frontend = await PostFrontendPage.init( page );
			expect( await frontend.isRenderedBlockPresent( WordAdsBlock ) ).toBeTruthy();
		} );
	} );
} );
