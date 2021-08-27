import BlockEditorPage from '../lib/pages/wp-admin/block-editor';
import PostFrontendPage from '../lib/pages/postFrontend';
import PinterestBlock from '../lib/pages/wp-admin/blocks/pinterest';
import EventbriteBlock from '../lib/pages/wp-admin/blocks/eventbrite';
import config from 'config';
import { testStep } from '../lib/reporters/reporter';
import { prerequisitesBuilder } from '../lib/env/prerequisites';
import { Plans } from '../lib/env/types';

/**
 *
 * @group post-connection
 * @group free-blocks
 * @group blocks
 * @group gutenberg
 * @group atomic
 */

describe( 'Free blocks', () => {
	let blockEditor;

	beforeAll( async () => {
		await prerequisitesBuilder()
			.withWpComLoggedIn( true )
			.withLoggedIn( true )
			.withConnection( true )
			.withPlan( Plans.Free )
			.build();
	} );

	beforeEach( async () => {
		await testStep( 'Visit block editor page', async () => {
			blockEditor = await BlockEditorPage.visit( page );
			await blockEditor.resolveWelcomeGuide( false );
		} );
	} );

	it( 'Pinterest block', async () => {
		const pinId = config.get( 'blocks.pinterest.pinId' );

		await testStep( 'Add a Pinterest block', async () => {
			const blockId = await blockEditor.insertBlock(
				PinterestBlock.name(),
				PinterestBlock.title()
			);

			const pinterestBlock = new PinterestBlock( blockId, page, pinId );
			await pinterestBlock.addEmbed();
		} );

		await testStep( 'Publish a post with a Pinterest block', async () => {
			await blockEditor.selectPostTitle();
			await blockEditor.publishPost();
			await blockEditor.viewPost();
		} );

		await testStep( 'Can assert that Pinterest block is rendered', async () => {
			const frontend = await PostFrontendPage.init( page );
			expect( await frontend.isRenderedBlockPresent( PinterestBlock, { pinId } ) ).toBeTruthy();
		} );
	} );

	it( 'Eventbrite block', async () => {
		const eventId = '112691417062';

		await testStep( 'Can visit the block editor and add a Eventbrite block', async () => {
			const blockId = await blockEditor.insertBlock(
				EventbriteBlock.name(),
				EventbriteBlock.title()
			);

			const eventbriteBlock = new EventbriteBlock( blockId, page, eventId );
			await eventbriteBlock.addEmbed();
		} );

		await testStep( 'Can publish a post with a Eventbrite block', async () => {
			await blockEditor.selectPostTitle();
			await blockEditor.publishPost();
			await blockEditor.viewPost();
		} );

		await testStep( 'Can assert that Eventbrite block is rendered', async () => {
			const frontend = await PostFrontendPage.init( page );
			expect(
				await frontend.isRenderedBlockPresent( EventbriteBlock, {
					eventId,
				} )
			).toBeTruthy();
		} );
	} );
} );
