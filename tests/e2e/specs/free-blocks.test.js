/**
 * Internal dependencies
 */
import BlockEditorPage from '../lib/pages/wp-admin/block-editor';
import PostFrontendPage from '../lib/pages/postFrontend';
import { connectThroughWPAdminIfNeeded } from '../lib/flows/jetpack-connect';
import { resetWordpressInstall, getNgrokSiteUrl, activateModule } from '../lib/utils-helper';
import PinterestBlock from '../lib/blocks/pinterest';

describe( 'Paid blocks', () => {
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
} );
