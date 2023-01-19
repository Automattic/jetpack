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
import { PostFrontendPage, SitePage } from 'jetpack-e2e-commons/pages/index.js';
import config from 'config';
import { prerequisitesBuilder, Plans } from 'jetpack-e2e-commons/env/index.js';
import playwrightConfig from '../../playwright.config.cjs';

test.describe( 'Free blocks', () => {
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
			await test.step( 'Visit block editor page', async () => {
				blockEditor = await BlockEditorPage.visit( page );
				await blockEditor.resolveWelcomeGuide( false );
			} );
		} );

		test( 'Pinterest block', async ( { page } ) => {
			const pinId = config.get( 'blocks.pinterest.pinId' );

			await test.step( 'Add a Pinterest block', async () => {
				const blockId = await blockEditor.insertBlock(
					PinterestBlock.name(),
					PinterestBlock.title()
				);

				const pinterestBlock = new PinterestBlock( blockId, page, pinId );
				await pinterestBlock.addEmbed();
			} );

			await test.step( 'Publish a post with a Pinterest block', async () => {
				await blockEditor.selectPostTitle();
				await blockEditor.publishPost();
				await blockEditor.viewPost();
			} );

			await test.step( 'Can assert that Pinterest block is rendered', async () => {
				const frontend = await PostFrontendPage.init( page );
				expect(
					await frontend.isRenderedBlockPresent( PinterestBlock, { pinId } ),
					'Block should be displayed'
				).toBeTruthy();
			} );
		} );

		test( 'Eventbrite block', async ( { page } ) => {
			const eventId = '112691417062';

			await test.step( 'Can visit the block editor and add a Eventbrite block', async () => {
				const blockId = await blockEditor.insertBlock(
					EventbriteBlock.name(),
					EventbriteBlock.title()
				);

				const eventbriteBlock = new EventbriteBlock( blockId, page, eventId );
				await eventbriteBlock.addEmbed();
			} );

			await test.step( 'Can publish a post with a Eventbrite block', async () => {
				await blockEditor.selectPostTitle();
				await blockEditor.publishPost();
				await blockEditor.viewPost();
			} );

			await test.step( 'Can assert that Eventbrite block is rendered', async () => {
				const frontend = await PostFrontendPage.init( page );
				expect(
					await frontend.isRenderedBlockPresent( EventbriteBlock, {
						eventId,
					} ),
					'Block should be displayed'
				).toBeTruthy();
			} );
		} );

		test( 'Form block', async ( { page } ) => {
			await test.step( 'Can visit the block editor and add a Form block', async () => {
				const blockId = await blockEditor.insertBlock( FormBlock.name(), FormBlock.title() );

				const block = new FormBlock( blockId, page );
				await block.selectFormVariation();
			} );

			await test.step( 'Can publish a post with a Form block', async () => {
				await blockEditor.selectPostTitle();
				await blockEditor.publishPost();
				await blockEditor.viewPost();
			} );

			await test.step( 'Can assert that Form block is rendered', async () => {
				const frontend = await PostFrontendPage.init( page );
				expect(
					await frontend.isRenderedBlockPresent( FormBlock ),
					'Block should be displayed'
				).toBeTruthy();
			} );
		} );

		test( 'Tiled Gallery block', async ( { page } ) => {
			await test.step( 'Can visit the block editor and add a Tiled Gallery block', async () => {
				const blockId = await blockEditor.insertBlock(
					TiledGalleryBlock.name(),
					TiledGalleryBlock.title()
				);
				const block = new TiledGalleryBlock( blockId, page );
				await block.addImages();

				await blockEditor.openSettingsSidebar();
				await block.linkToAttachment();
			} );

			await test.step( 'Can publish a post with a Tiled Gallery block', async () => {
				await blockEditor.selectPostTitle();
				await blockEditor.publishPost();
				await blockEditor.viewPost();
			} );

			await test.step( 'Can assert that Tiled Gallery block is rendered', async () => {
				const frontend = await PostFrontendPage.init( page );
				expect(
					await frontend.isRenderedBlockPresent( TiledGalleryBlock ),
					'Block should be displayed'
				).toBeTruthy();
			} );
		} );

		test( 'Subscribe block', async ( { page } ) => {
			await prerequisitesBuilder( page ).withActiveModules( [ 'subscriptions' ] ).build();
			let block;

			await test.step( 'Can visit the block editor and add a Subscribe block', async () => {
				const blockId = await blockEditor.insertBlock(
					SubscribeBlock.name(),
					SubscribeBlock.title()
				);
				block = new SubscribeBlock( blockId, page );
				await block.checkBlock();
			} );

			await test.step( 'Can publish a post with a Subscribe block', async () => {
				await blockEditor.selectPostTitle();
				await blockEditor.publishPost();
				await blockEditor.viewPost();
			} );

			await test.step( 'Can assert that Subscribe block is rendered', async () => {
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
			await test.step( 'Visit site editor page', async () => {
				siteEditor = await SiteEditorPage.visit( page );
				await siteEditor.clearCustomizations();
			} );
		} );

		test.afterEach( async () => {
			await test.step( 'Visit site editor page', async () => {
				await siteEditor.page.bringToFront();
			} );
		} );

		test( 'Subscribe block', async ( { page } ) => {
			await prerequisitesBuilder( page ).withActiveModules( [ 'subscriptions' ] ).build();
			let block;

			await test.step( 'Can insert a Subscribe block', async () => {
				const blockId = await siteEditor.insertBlock(
					SubscribeBlock.name(),
					SubscribeBlock.title()
				);
				block = new SubscribeBlock( blockId, page );
				await block.checkBlock();
			} );

			let newTab;
			await test.step( 'Can publish a page with a Subscribe block', async () => {
				await siteEditor.savePage();
				newTab = await siteEditor.viewPage();
			} );

			await test.step( 'Can assert that Subscribe block is rendered', async () => {
				expect(
					await block.isRenderedInFrontend( await SitePage.init( newTab ) ),
					'Block should be displayed'
				).toBeTruthy();
			} );
		} );
	} );
} );
