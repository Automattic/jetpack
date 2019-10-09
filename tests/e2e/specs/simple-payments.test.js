/**
 * Internal dependencies
 */
import BlockEditorPage from '../lib/pages/wp-admin/block-editor';
import SimplePaymentBlock from '../lib/blocks/simple-payments';
import PostFrontendPage from '../lib/pages/postFrontend';
import { connectThroughJetpackStart } from '../lib/flows/jetpack-connect';
import { resetWordpressInstall, getNgrokSiteUrl, execShellCommand } from '../lib/utils-helper';
import { sendMessageToSlack } from '../lib/reporters/slack';

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

		const availability = await page.evaluate(
			() => window.Jetpack_Editor_Initial_State.available_blocks
		);
		await sendMessageToSlack( JSON.stringify( availability[ 'simple-payments' ] ) );

		await blockEditor.publishPost();
		await blockEditor.viewPost();

		const frontend = await PostFrontendPage.init( page );
		await execShellCommand( 'wp option get jetpack_active_plan --path="/home/travis/wordpress"' );
		await page.reload( { waitFor: 'networkidle0' } );
		await PostFrontendPage.init( page );
		await execShellCommand( 'wp option get jetpack_active_plan --path="/home/travis/wordpress"' );

		await frontend.isRenderedBlockPresent( SimplePaymentBlock );
	} );
} );
