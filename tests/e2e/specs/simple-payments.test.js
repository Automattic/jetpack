/**
 * WordPress dependencies
 */
import { createNewPost } from '@wordpress/e2e-test-utils/build/create-new-post';
/**
 * Internal dependencies
 */
import BlockEditorPage from '../lib/pages/wp-admin/block-editor';
import SimplePaymentBlock from '../lib/blocks/simple-payments';
import PostFrontendPage from '../lib/pages/postFrontend';
import { connectThroughWPAdminIfNeeded } from '../lib/flows/jetpack-connect';

describe( 'Simple Payment', () => {
	it( 'Can publish a post with a Simple Payments block', async () => {
		//Can login and connect Jetpack if needed
		await connectThroughWPAdminIfNeeded();

		await createNewPost();

		const blockEditor = await BlockEditorPage.init( page );
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
