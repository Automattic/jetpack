/**
 * Internal dependencies
 */
import BlockEditorPage from '../lib/pages/wp-admin/block-editor';
import PostFrontendPage from '../lib/pages/postFrontend';
import { connectThroughWPAdminIfNeeded } from '../lib/flows/jetpack-connect';
import { resetWordpressInstall, getNgrokSiteUrl, activateModule } from '../lib/utils-helper';
import PinterestBlock from '../lib/blocks/pinterest';
import EventbriteBlock from '../lib/blocks/eventbrite';

describe( 'Free blocks', () => {
	beforeAll( async () => {
		await resetWordpressInstall();
		const url = getNgrokSiteUrl();
		console.log( 'NEW SITE URL: ' + url );

		await connectThroughWPAdminIfNeeded( { mockPlanData: false } );

		await activateModule( page, 'publicize' );
		await activateModule( page, 'wordads' );
	} );

	describe( 'Pinterest block', () => {
		it( 'Can publish a post with a Pinterest block', async () => {
			const blockEditor = await BlockEditorPage.visit( page );
			const blockInfo = await blockEditor.insertBlock(
				PinterestBlock.name(),
				PinterestBlock.title()
			);

			const pinterestBlock = new PinterestBlock( blockInfo, page );
			await pinterestBlock.addEmbed();

			await blockEditor.focus();
			await blockEditor.publishPost();
			await blockEditor.viewPost();

			const frontend = await PostFrontendPage.init( page );
			await frontend.isRenderedBlockPresent( PinterestBlock );
		} );
	} );

	describe( 'Eventbrite block', () => {
		it( 'Can publish a post with a Eventbrite block', async () => {
			const blockEditor = await BlockEditorPage.visit( page );
			const blockInfo = await blockEditor.insertBlock(
				EventbriteBlock.name(),
				EventbriteBlock.title()
			);

			const eventbriteBlock = new EventbriteBlock( blockInfo, page );
			await eventbriteBlock.addEmbed();

			await blockEditor.focus();
			await blockEditor.publishPost();
			await blockEditor.viewPost();

			const frontend = await PostFrontendPage.init( page );
			await frontend.isRenderedBlockPresent( EventbriteBlock );
		} );
	} );
} );
