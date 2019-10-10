/**
 * Internal dependencies
 */
import BlockEditorPage from '../lib/pages/wp-admin/block-editor';
import SimplePaymentBlock from '../lib/blocks/simple-payments';
import PostFrontendPage from '../lib/pages/postFrontend';
import { connectThroughJetpackStart } from '../lib/flows/jetpack-connect';
import { resetWordpressInstall, getNgrokSiteUrl, execShellCommand } from '../lib/utils-helper';

describe( 'Simple Payment', () => {
	beforeAll( async () => {
		await resetWordpressInstall();
		const url = getNgrokSiteUrl();
		console.log( 'NEW SITE URL: ' + url );
	} );

	it( 'Can publish a post with a Simple Payments block', async () => {
		await connectThroughJetpackStart();

		const blockEditor = await BlockEditorPage.visit( page );

		const blockInfo = await blockEditor.insertBlock( SimplePaymentBlock.name() );

		const spBlock = new SimplePaymentBlock( blockInfo, page );
		await spBlock.fillDetails();

		await blockEditor.focus();
		await blockEditor.publishPost();
		await blockEditor.viewPost();

		const frontend = await PostFrontendPage.init( page );
		frontend.reloadUntil( async () => {
			const r = await execShellCommand(
				'wp option get jetpack_active_plan --path="/home/travis/wordpress"'
			);
			return typeof r === 'string' ? false : true;
		} );
		await frontend.isRenderedBlockPresent( SimplePaymentBlock );
	} );
} );
