import BlockEditorPage from '../lib/pages/wp-admin/block-editor';
import PostFrontendPage from '../lib/pages/postFrontend';
import MailchimpBlock from '../lib/pages/wp-admin/blocks/mailchimp';
import SimplePaymentBlock from '../lib/pages/wp-admin/blocks/simple-payments';
import WordAdsBlock from '../lib/pages/wp-admin/blocks/word-ads';
import { testStep } from '../lib/reporters/reporter';
import { prerequisitesBuilder } from '../lib/env/prerequisites';
import { Plans } from '../lib/env/types';

/**
 *
 * @group post-connection
 * @group pro-blocks
 * @group blocks
 * @group gutenberg
 * @group atomic
 */
describe( 'Paid blocks', () => {
	let blockEditor;

	beforeAll( async () => {
		await prerequisitesBuilder()
			.withWpComLoggedIn( true )
			.withLoggedIn( true )
			.withConnection( true )
			.withPlan( Plans.Complete )
			.build();
	} );

	beforeEach( async () => {
		await testStep( 'Visit block editor page', async () => {
			blockEditor = await BlockEditorPage.visit( page );
			await blockEditor.resolveWelcomeGuide( false );
		} );
	} );

	it( 'MailChimp Block', async () => {
		let blockId;

		await testStep( 'Add a MailChimp block', async () => {
			blockId = await blockEditor.insertBlock( MailchimpBlock.name(), MailchimpBlock.title() );
		} );

		await testStep( 'Connect to MailChimp', async () => {
			const mcBlock = new MailchimpBlock( blockId, page );
			mcBlock.removeCookieByName( 'wordpress_logged_in' );
			await mcBlock.connect( false );
		} );

		await testStep( 'Publish a post and assert that MailChimp block is rendered', async () => {
			await blockEditor.selectPostTitle();
			await blockEditor.publishPost();
			await blockEditor.viewPost();
			const frontend = await PostFrontendPage.init( page );
			expect( await frontend.isRenderedBlockPresent( MailchimpBlock ) ).toBeTruthy();
		} );
	} );

	it( 'Pay with PayPal', async () => {
		let blockId;

		await testStep( 'Add a Pay with PayPal block', async () => {
			blockId = await blockEditor.insertBlock(
				SimplePaymentBlock.name(),
				SimplePaymentBlock.title()
			);
		} );

		await testStep( 'Fill details of Pay with PayPal block', async () => {
			const spBlock = new SimplePaymentBlock( blockId, page );
			await spBlock.fillDetails();
		} );

		await testStep(
			'Publish a post and assert that Pay with PayPal block is rendered',
			async () => {
				await blockEditor.setTitle( 'Pay with PayPal block' );
				await blockEditor.publishPost();
				await blockEditor.viewPost();
				const frontend = await PostFrontendPage.init( page );
				expect( await frontend.isRenderedBlockPresent( SimplePaymentBlock ) ).toBeTruthy();
			}
		);
	} );

	it( 'WordAds block', async () => {
		await prerequisitesBuilder().withActiveModules( [ 'wordads' ] ).build();

		let blockId;

		await testStep( 'Add a WordAds block', async () => {
			await blockEditor.waitForAvailableBlock( WordAdsBlock.name() );
			blockId = await blockEditor.insertBlock( WordAdsBlock.name(), WordAdsBlock.title() );
			await blockEditor.selectPostTitle();
		} );

		await testStep( 'Switch to Wide Skyscraper ad format', async () => {
			const adBlock = new WordAdsBlock( blockId, page );
			await adBlock.focus();
			await adBlock.switchFormat( 4 ); // switch to Wide Skyscraper ad format
		} );

		await testStep( 'Publish a post and assert that WordAds block is rendered', async () => {
			await blockEditor.selectPostTitle();
			await blockEditor.publishPost();
			await blockEditor.viewPost();

			const frontend = await PostFrontendPage.init( page );
			expect( await frontend.isRenderedBlockPresent( WordAdsBlock ) ).toBeTruthy();
		} );
	} );
} );
