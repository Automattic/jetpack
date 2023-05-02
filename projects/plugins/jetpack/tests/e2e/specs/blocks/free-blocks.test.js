import { test, expect } from 'jetpack-e2e-commons/fixtures/base-test.js';
import {
	BlockEditorPage,
	SiteEditorPage,
	PinterestBlock,
	EventbriteBlock,
	FormBlock,
	TiledGalleryBlock,
	SubscribeBlock,
} from 'jetpack-e2e-commons/pages/wp-admin/index.js';
import { PostFrontendPage } from 'jetpack-e2e-commons/pages/index.js';
import config from 'config';
import { prerequisitesBuilder, Plans } from 'jetpack-e2e-commons/env/index.js';
import playwrightConfig from '../../playwright.config.cjs';

test.beforeAll( async ( { browser } ) => {
	const page = await browser.newPage( playwrightConfig.use );
	await prerequisitesBuilder( page )
		.withLoggedIn( true )
		.withConnection( true )
		.withPlan( Plans.Free )
		.build();
	await page.close();
} );

test.describe( 'Post editor', () => {
	let blockEditor;

	test.beforeEach( async ( { page } ) => {
		await test.step( 'Visit the post editor page', async () => {
			blockEditor = await BlockEditorPage.visit( page );
			await blockEditor.resolveWelcomeGuide( false );
			await blockEditor.waitForEditor();
		} );
	} );

	test( 'Pinterest block in post editor', async ( { page } ) => {
		const pinId = config.get( 'blocks.pinterest.pinId' );

		await test.step( 'Insert a Pinterest block', async () => {
			const blockId = await blockEditor.insertBlock(
				PinterestBlock.name(),
				PinterestBlock.title()
			);

			const pinterestBlock = new PinterestBlock( blockId, page, pinId );
			await pinterestBlock.addEmbed();
		} );

		await test.step( 'Publish the post', async () => {
			await blockEditor.selectPostTitle();
			await blockEditor.publishPost();
			await blockEditor.viewPost();
		} );

		await test.step( 'Pinterest block is rendered', async () => {
			const frontend = await PostFrontendPage.init( page );
			expect(
				await frontend.isRenderedBlockPresent( PinterestBlock, { pinId } ),
				'Block should be displayed'
			).toBeTruthy();
		} );
	} );

	test( 'Eventbrite block in post editor', async ( { page } ) => {
		const eventId = '112691417062';

		await test.step( 'Insert an Eventbrite block', async () => {
			const blockId = await blockEditor.insertBlock(
				EventbriteBlock.name(),
				EventbriteBlock.title()
			);

			const eventbriteBlock = new EventbriteBlock( blockId, page, eventId );
			await eventbriteBlock.addEmbed();
		} );

		await test.step( 'Publish the post', async () => {
			await blockEditor.selectPostTitle();
			await blockEditor.publishPost();
			await blockEditor.viewPost();
		} );

		await test.step( 'Eventbrite block is rendered', async () => {
			const frontend = await PostFrontendPage.init( page );
			expect(
				await frontend.isRenderedBlockPresent( EventbriteBlock, {
					eventId,
				} ),
				'Block should be displayed'
			).toBeTruthy();
		} );
	} );

	test( 'Form block in post editor', async ( { page } ) => {
		await test.step( 'Insert a Form block', async () => {
			const blockId = await blockEditor.insertBlock( FormBlock.name(), FormBlock.title() );

			const block = new FormBlock( blockId, page );
			await block.selectFormVariation();
		} );

		await test.step( 'Publish the post', async () => {
			await blockEditor.selectPostTitle();
			await blockEditor.publishPost();
			await blockEditor.viewPost();
		} );

		await test.step( 'Form block is rendered', async () => {
			const frontend = await PostFrontendPage.init( page );
			expect(
				await frontend.isRenderedBlockPresent( FormBlock ),
				'Block should be displayed'
			).toBeTruthy();
		} );
	} );

	test( 'Tiled Gallery block in post editor', async ( { page } ) => {
		await test.step( 'Insert a Tiled Gallery block', async () => {
			const blockId = await blockEditor.insertBlock(
				TiledGalleryBlock.name(),
				TiledGalleryBlock.title()
			);
			const block = new TiledGalleryBlock( blockId, page );
			await block.addImages();

			await blockEditor.openSettingsSidebar();
			await block.linkToAttachment();
		} );

		await test.step( 'Publish the post', async () => {
			await blockEditor.selectPostTitle();
			await blockEditor.publishPost();
			await blockEditor.viewPost();
		} );

		await test.step( 'Tiled Gallery block is rendered', async () => {
			const frontend = await PostFrontendPage.init( page );
			expect(
				await frontend.isRenderedBlockPresent( TiledGalleryBlock ),
				'Block should be displayed'
			).toBeTruthy();
		} );
	} );

	test( 'Subscribe block in post editor', async ( { page } ) => {
		await prerequisitesBuilder( page ).withActiveModules( [ 'subscriptions' ] ).build();
		const block = new SubscribeBlock( null, page );

		await test.step( 'Insert a Subscribe block', async () => {
			await block.insertBlock( new BlockEditorPage( page ) );
		} );

		await test.step( 'Publish the post', async () => {
			await blockEditor.selectPostTitle();
			await blockEditor.publishPost();
			await blockEditor.viewPost();
		} );

		await test.step( 'Subscribe block is rendered', async () => {
			expect(
				await block.isRenderedInFrontend( await PostFrontendPage.init( page ) ),
				'Block should be displayed'
			).toBeTruthy();
		} );
	} );
} );

test.describe( 'Site editor', () => {
	let siteEditor;

	test.beforeEach( async ( { page } ) => {
		await test.step( 'Visit the site editor page', async () => {
			siteEditor = await SiteEditorPage.visit( page );
			await siteEditor.edit();
			await siteEditor.closeWelcomeGuide();
			await siteEditor.clearCustomizations();
		} );
	} );
	/*
	* TODO: Re-enable once the site editor is ready for e2e tests #29113.
	test( 'Subscribe block in site editor', async ( { page } ) => {
		await prerequisitesBuilder( page ).withActiveModules( [ 'subscriptions' ] ).build();
		const block = new SubscribeBlock( null, page );

		await test.step( 'Insert a Subscribe block', async () => {
			await block.insertBlock( new SiteEditorPage( page ) );
		} );

		let newTab;
		await test.step( 'Save the page', async () => {
			await siteEditor.savePage();
			newTab = await siteEditor.viewPage();
		} );

		await test.step( 'The block is rendered', async () => {
			expect(
				await block.isRenderedInFrontend( newTab ),
				'Block should be displayed'
			).toBeTruthy();
		} );
	} );
	 */
} );
