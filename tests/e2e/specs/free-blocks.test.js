/**
 * Internal dependencies
 */
import BlockEditorPage from '../lib/pages/wp-admin/block-editor';
import PostFrontendPage from '../lib/pages/postFrontend';
import { syncJetpackPlanData } from '../lib/flows/jetpack-connect';
import PinterestBlock from '../lib/blocks/pinterest';
import EventbriteBlock from '../lib/blocks/eventbrite';
import { catchBeforeAll } from '../lib/setup-env';

describe( 'Free blocks', () => {
	catchBeforeAll( async () => {
		await syncJetpackPlanData( 'free' );
	} );

	describe( 'Pinterest block', () => {
		it( 'Can publish a post with a Pinterest block', async () => {
			const pinId = '180003316347175596';
			const blockEditor = await BlockEditorPage.visit( page );
			const blockInfo = await blockEditor.insertBlock(
				PinterestBlock.name(),
				PinterestBlock.title()
			);

			const pinterestBlock = new PinterestBlock( blockInfo, page, pinId );
			await pinterestBlock.addEmbed();

			await blockEditor.focus();
			await blockEditor.publishPost();
			await blockEditor.viewPost();

			const frontend = await PostFrontendPage.init( page );
			await frontend.isRenderedBlockPresent( PinterestBlock, { pinId } );
		} );
	} );

	describe( 'Eventbrite block', () => {
		it( 'Can publish a post with a Eventbrite block', async () => {
			const eventId = '96820156695';
			const blockEditor = await BlockEditorPage.visit( page );
			const blockInfo = await blockEditor.insertBlock(
				EventbriteBlock.name(),
				EventbriteBlock.title()
			);

			const eventbriteBlock = new EventbriteBlock( blockInfo, page, eventId );
			await eventbriteBlock.addEmbed();

			await blockEditor.focus();
			await blockEditor.publishPost();
			await blockEditor.viewPost();

			const frontend = await PostFrontendPage.init( page );
			await frontend.isRenderedBlockPresent( EventbriteBlock, { eventId } );
		} );
	} );
} );
