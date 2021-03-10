/**
 * Internal dependencies
 */
import BlockEditorPage from '../lib/pages/wp-admin/block-editor';
import PostFrontendPage from '../lib/pages/postFrontend';
import { syncJetpackPlanData } from '../lib/flows/jetpack-connect';
import PinterestBlock from '../lib/blocks/pinterest';
import EventbriteBlock from '../lib/blocks/eventbrite';
import { step } from '../lib/env/test-setup';

describe( 'Free blocks', () => {
	beforeAll( async () => {
		await syncJetpackPlanData( 'free' );
	} );

	it( 'Pinterest block', async () => {
		const pinId = '180003316347175596';
		let blockEditor;

		await step( 'Can visit the block editor and add a Pinterest block', async () => {
			blockEditor = await BlockEditorPage.visit( page );
			const blockId = await blockEditor.insertBlock(
				PinterestBlock.name(),
				PinterestBlock.title()
			);

			const pinterestBlock = new PinterestBlock( blockId, page, pinId );
			await pinterestBlock.addEmbed();
		} );

		await step( 'Can publish a post with a Pinterest block', async () => {
			await blockEditor.selectPostTitle();
			await blockEditor.publishPost();
			await blockEditor.viewPost();
		} );

		await step( 'Can assert that Pinterest block is rendered', async () => {
			const frontend = await PostFrontendPage.init( page );
			expect( await frontend.isRenderedBlockPresent( PinterestBlock, { pinId } ) ).toBeTruthy();
		} );
	} );
	it( 'Eventbrite block', async () => {
		const eventId = '112691417062';
		let blockEditor;

		await step( 'Can visit the block editor and add a Eventbrite block', async () => {
			blockEditor = await BlockEditorPage.visit( page );
			const blockId = await blockEditor.insertBlock(
				EventbriteBlock.name(),
				EventbriteBlock.title()
			);

			const eventbriteBlock = new EventbriteBlock( blockId, page, eventId );
			await eventbriteBlock.addEmbed();
		} );

		await step( 'Can publish a post with a Eventbrite block', async () => {
			await blockEditor.selectPostTitle();
			await blockEditor.publishPost();
			await blockEditor.viewPost();
		} );

		await step( 'Can assert that Eventbrite block is rendered', async () => {
			const frontend = await PostFrontendPage.init( page );
			expect(
				await frontend.isRenderedBlockPresent( EventbriteBlock, {
					eventId,
				} )
			).toBeTruthy();
		} );
	} );
} );
