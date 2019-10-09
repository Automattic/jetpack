/**
 * Internal dependencies
 */
import BlockEditorPage from '../lib/pages/wp-admin/block-editor';
import SimplePaymentBlock from '../lib/blocks/simple-payments';
import PostFrontendPage from '../lib/pages/postFrontend';
import { connectThroughJetpackStart } from '../lib/flows/jetpack-connect';
import { resetWordpressInstall, getNgrokSiteUrl, execShellCommand } from '../lib/utils-helper';
import { sendFailedTestScreenshotToSlack } from '../lib/reporters/slack';
import { takeScreenshot } from '../lib/reporters/screenshot';
import { logHTML } from '../lib/page-helper';

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

		const filePath = await takeScreenshot( 'test', 'simple-payment' );
		await sendFailedTestScreenshotToSlack( filePath );
		await logHTML();

		const availability = await page.evaluate(
			() => window.Jetpack_Editor_Initial_State.available_blocks
		);
		console.log( availability );

		await blockEditor.publishPost();
		await blockEditor.viewPost();

		const frontend = await PostFrontendPage.init( page );
		await frontend.isRenderedBlockPresent( SimplePaymentBlock );
	} );
} );
