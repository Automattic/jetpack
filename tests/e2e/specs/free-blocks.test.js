/**
 * Internal dependencies
 */
import BlockEditorPage from '../lib/pages/wp-admin/block-editor';
import PostFrontendPage from '../lib/pages/postFrontend';
import { syncJetpackPlanData } from '../lib/flows/jetpack-connect';
import PinterestBlock from '../lib/blocks/pinterest';
import EventbriteBlock from '../lib/blocks/eventbrite';
import { catchBeforeAll, step } from '../lib/setup-env';

describe( 'Free blocks', () => {
	catchBeforeAll( async () => {
		await syncJetpackPlanData( 'free' );
	} );

	it( 'Pinterest block', async () => {
		const pinId = '180003316347175596';
		let blockEditor;

		await step( 'Can visit the block editor and add a Pinterest block', async () => {
			blockEditor = await BlockEditorPage.visit( page );
			const blockInfo = await blockEditor.insertBlock(
				PinterestBlock.name(),
				PinterestBlock.title()
			);

			const pinterestBlock = new PinterestBlock( blockInfo, page, pinId );
			await pinterestBlock.addEmbed();
		} );

		await step( 'Can publish a post with a Pinterest block', async () => {
			await blockEditor.focus();
			await blockEditor.publishPost();
			await blockEditor.viewPost();
		} );

		await step( 'Can assert that Pinterest block is rendered', async () => {
			const frontend = await PostFrontendPage.init( page );
			await frontend.isRenderedBlockPresent( PinterestBlock, { pinId } );
		} );
	} );

	it( 'Eventbrite block', async () => {
		const eventId = '96820156695';
		let blockEditor;

		await step( 'Can visit the block editor and add a Eventbrite block', async () => {
			blockEditor = await BlockEditorPage.visit( page );
			const blockInfo = await blockEditor.insertBlock(
				EventbriteBlock.name(),
				EventbriteBlock.title()
			);

			const eventbriteBlock = new EventbriteBlock( blockInfo, page, eventId );
			await eventbriteBlock.addEmbed();
		} );

		await step( 'Can publish a post with a Eventbrite block', async () => {
			await blockEditor.focus();
			await blockEditor.publishPost();
			await blockEditor.viewPost();
		} );

		await step( 'Can assert that Eventbrite block is rendered', async () => {
			const frontend = await PostFrontendPage.init( page );
			await frontend.isRenderedBlockPresent( EventbriteBlock, { eventId } );
		} );
	} );
} );
