import { test, expect } from 'jetpack-e2e-commons/fixtures/base-test.js';
import {
	BlockEditorPage,
	MailchimpBlock,
	SimplePaymentBlock,
	WordAdsBlock,
} from 'jetpack-e2e-commons/pages/wp-admin/index.js';
import { PostFrontendPage } from 'jetpack-e2e-commons/pages/index.js';
import { prerequisitesBuilder, Plans } from 'jetpack-e2e-commons/env/index.js';
import playwrightConfig from '../../playwright.config.cjs';

test.describe( 'Paid blocks', () => {
	let blockEditor;

	test.beforeAll( async ( { browser } ) => {
		const page = await browser.newPage( playwrightConfig.use );
		await prerequisitesBuilder( page )
			.withWpComLoggedIn( true )
			.withLoggedIn( true )
			.withConnection( true )
			.withPlan( Plans.Complete )
			.build();
		await page.close();
	} );

	test.beforeEach( async ( { page } ) => {
		await test.step( 'Visit block editor page', async () => {
			blockEditor = await BlockEditorPage.visit( page );
			await blockEditor.resolveWelcomeGuide( false );
		} );
	} );

	test( 'MailChimp Block', async ( { page } ) => {
		let blockId;

		await test.step( 'Add a MailChimp block', async () => {
			blockId = await blockEditor.insertBlock( MailchimpBlock.name(), MailchimpBlock.title() );
		} );

		await test.step( 'Connect to MailChimp', async () => {
			const mcBlock = new MailchimpBlock( blockId, page );
			await mcBlock.connect();
		} );

		await test.step( 'Publish a post and assert that MailChimp block is rendered', async () => {
			await blockEditor.selectPostTitle();
			await blockEditor.publishPost();
			await blockEditor.viewPost();
			const frontend = await PostFrontendPage.init( page );
			expect(
				await frontend.isRenderedBlockPresent( MailchimpBlock ),
				'Block should be displayed'
			).toBeTruthy();
		} );
	} );

	test( 'Pay with PayPal', async ( { page } ) => {
		let blockId;

		await test.step( 'Add a Pay with PayPal block', async () => {
			blockId = await blockEditor.insertBlock(
				SimplePaymentBlock.name(),
				SimplePaymentBlock.title()
			);
		} );

		await test.step( 'Fill details of Pay with PayPal block', async () => {
			const spBlock = new SimplePaymentBlock( blockId, page );
			await spBlock.fillDetails();
		} );

		await test.step(
			'Publish a post and assert that Pay with PayPal block is rendered',
			async () => {
				await blockEditor.setTitle( 'Pay with PayPal block' );
				await blockEditor.publishPost();
				await blockEditor.viewPost();
				const frontend = await PostFrontendPage.init( page );
				expect(
					await frontend.isRenderedBlockPresent( SimplePaymentBlock ),
					'Block should be displayed'
				).toBeTruthy();
			}
		);
	} );

	test( 'WordAds block', async ( { page } ) => {
		await prerequisitesBuilder().withActiveModules( [ 'wordads' ] ).build();

		let blockId;

		await test.step( 'Add a WordAds block', async () => {
			await blockEditor.waitForAvailableBlock( WordAdsBlock.name() );
			blockId = await blockEditor.insertBlock( WordAdsBlock.name(), WordAdsBlock.title() );
			await blockEditor.selectPostTitle();
		} );

		await test.step( 'Switch to Wide Skyscraper ad format', async () => {
			const adBlock = new WordAdsBlock( blockId, page );
			await adBlock.focus();
			await adBlock.switchFormat( 4 ); // switch to Wide Skyscraper ad format
		} );

		await test.step( 'Publish a post and assert that WordAds block is rendered', async () => {
			await blockEditor.selectPostTitle();
			await blockEditor.publishPost();
			await blockEditor.viewPost();

			const frontend = await PostFrontendPage.init( page );
			expect(
				await frontend.isRenderedBlockPresent( WordAdsBlock ),
				'Block should be displayed'
			).toBeTruthy();
		} );
	} );
} );
