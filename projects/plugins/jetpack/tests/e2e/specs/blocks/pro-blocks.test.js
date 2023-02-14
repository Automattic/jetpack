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
	await test.step( 'Visit the post editor page', async () => {
		blockEditor = await BlockEditorPage.visit( page );
		await blockEditor.resolveWelcomeGuide( false );
		await blockEditor.waitForEditor();
	} );
} );

test( 'MailChimp block in post editor', async ( { page } ) => {
	let blockId;

	await test.step( 'Insert a MailChimp block', async () => {
		blockId = await blockEditor.insertBlock( MailchimpBlock.name(), MailchimpBlock.title() );
	} );

	await test.step( 'Connect to MailChimp', async () => {
		const mcBlock = new MailchimpBlock( blockId, page );
		await mcBlock.connect();
	} );

	await test.step( 'Publish the post', async () => {
		await blockEditor.selectPostTitle();
		await blockEditor.publishPost();
		await blockEditor.viewPost();
	} );

	await test.step( 'The block is rendered', async () => {
		const frontend = await PostFrontendPage.init( page );
		expect(
			await frontend.isRenderedBlockPresent( MailchimpBlock ),
			'Block should be displayed'
		).toBeTruthy();
	} );
} );

test( 'Pay with PayPal block in post editor', async ( { page } ) => {
	let block;

	await test.step( 'Insert a simple payment block', async () => {
		block = new SimplePaymentBlock( null, page );
		await block.insertBlock();
	} );

	await test.step( 'Fill block details', async () => {
		await block.fillDetails();
	} );

	await test.step( 'Publish the post', async () => {
		await blockEditor.setTitle( 'Pay with PayPal block' );
		await blockEditor.publishPost();
		await blockEditor.viewPost();
	} );

	await test.step( 'The block is rendered', async () => {
		const frontend = await PostFrontendPage.init( page );
		expect(
			await frontend.isRenderedBlockPresent( SimplePaymentBlock ),
			'Block should be displayed'
		).toBeTruthy();
	} );
} );

test( 'WordAds block in post editor', async ( { page } ) => {
	await prerequisitesBuilder().withActiveModules( [ 'wordads' ] ).build();

	let blockId;

	await test.step( 'Insert a WordAds block', async () => {
		blockId = await blockEditor.insertBlock( WordAdsBlock.name(), WordAdsBlock.title() );
		await blockEditor.selectPostTitle();
	} );

	await test.step( 'Switch to Wide Skyscraper ad format', async () => {
		const adBlock = new WordAdsBlock( blockId, page );
		await adBlock.focus();
		await adBlock.switchFormat( 4 );
	} );

	await test.step( 'Publish the post', async () => {
		await blockEditor.selectPostTitle();
		await blockEditor.publishPost();
		await blockEditor.viewPost();
	} );

	await test.step( 'The block is rendered', async () => {
		const frontend = await PostFrontendPage.init( page );
		expect(
			await frontend.isRenderedBlockPresent( WordAdsBlock ),
			'Block should be displayed'
		).toBeTruthy();
	} );
} );
