import { test, expect } from 'jetpack-e2e-commons/fixtures/base-test.js';
import {
	BlockEditorPage,
	PinterestBlock,
	EventbriteBlock,
} from 'jetpack-e2e-commons/pages/wp-admin/index.js';
import { PostFrontendPage } from 'jetpack-e2e-commons/pages/index.js';
import config from 'config';
import { prerequisitesBuilder, Plans } from 'jetpack-e2e-commons/env/index.js';
import playwrightConfig from '../../playwright.config.cjs';

test.describe.parallel( 'Free blocks', () => {
	let blockEditor;

	test.beforeAll( async ( { browser } ) => {
		const page = await browser.newPage( playwrightConfig.use );
		await prerequisitesBuilder( page )
			.withWpComLoggedIn( true )
			.withLoggedIn( true )
			.withConnection( true )
			.withPlan( Plans.Free )
			.build();
		await page.close();
	} );

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
} );
