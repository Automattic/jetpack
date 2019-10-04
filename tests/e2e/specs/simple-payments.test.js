/**
 * Internal dependencies
 */
import BlockEditorPage from '../lib/pages/wp-admin/block-editor';
import SimplePaymentBlock from '../lib/blocks/simple-payments';
import PostFrontendPage from '../lib/pages/postFrontend';
import { connectThroughWPAdminIfNeeded } from '../lib/flows/jetpack-connect';
import { resetWordpressInstall, getNgrokSiteUrl } from '../lib/utils-helper';
import Sidebar from '../lib/pages/wp-admin/sidebar';

describe( 'Simple Payment', () => {
	beforeAll( async () => {
		await resetWordpressInstall();
		const url = getNgrokSiteUrl();
		console.log( 'NEW SITE URL: ' + url );
	} );

	it( 'Can publish a post with a Simple Payments block', async () => {
		//Can login and connect Jetpack if needed
		await connectThroughWPAdminIfNeeded();

		// await ( await Sidebar.init( page ) ).selectNewPost();

		// const blockEditor = await BlockEditorPage.init( page );
		const blockEditor = await BlockEditorPage.visit( page );

		const blockInfo = await blockEditor.insertBlock( SimplePaymentBlock.name() );

		const spBlock = new SimplePaymentBlock( blockInfo, page );
		await spBlock.fillDetails();

		await blockEditor.focus();

		await blockEditor.publishPost();
		await blockEditor.viewPost();

		const frontend = await PostFrontendPage.init( page );
		await frontend.isRenderedBlockPresent( SimplePaymentBlock );
	} );
} );
