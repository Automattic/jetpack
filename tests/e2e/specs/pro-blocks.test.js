/**
 * Internal dependencies
 */
import BlockEditorPage from '../lib/pages/wp-admin/block-editor';
import PostFrontendPage from '../lib/pages/postFrontend';
import MailchimpBlock from '../lib/blocks/mailchimp';
import { connectThroughWPAdminIfNeeded } from '../lib/flows/jetpack-connect';
import {
	resetWordpressInstall,
	getNgrokSiteUrl,
	activateModule,
	execWpCommand,
} from '../lib/utils-helper';
import SimplePaymentBlock from '../lib/blocks/simple-payments';
import WordAdsBlock from '../lib/blocks/word-ads';
import PinterestBlock from '../lib/blocks/pinterest';

describe( 'Paid blocks', () => {
	beforeAll( async () => {
		await resetWordpressInstall();
		const url = getNgrokSiteUrl();
		console.log( 'NEW SITE URL: ' + url );

		await connectThroughWPAdminIfNeeded( { mockPlanData: true } );

		await activateModule( 'wordads' );
		await activateModule( 'publicize' );

		// const jetpackPage = await JetpackPage.init( page );
		// let ads = await page.evaluate( () => Initial_State.getModules.wordads );

		// for ( let i = 0; i < 10; i++ ) {
		// 	if ( ads.activated ) {
		// 		break;
		// 	}
		// 	await jetpackPage.reload();
		// 	await activateModule( 'wordads' );

		// 	await execWpCommand( 'wp option get jetpack_active_modules --format=json' );

		// 	await page.waitFor( 1000 );

		// 	ads = await page.evaluate( () => Initial_State.getModules.wordads );
		// }

		// await page.waitFor( 10000 ); // Trying to wait for plan data to be updated

		let isSame = false;
		let frPlan = null;
		let bkPlan = null;

		do {
			frPlan = await page.evaluate( () => Initial_State.siteData.plan.product_slug );
			bkPlan = JSON.parse(
				await execWpCommand( 'wp option get jetpack_active_plan --format=json' )
			);
			console.log( '!!! PLANS: ', frPlan, bkPlan.product_slug );
			isSame = frPlan.trim() === bkPlan.product_slug.trim();
			await page.reload( { waitFor: 'networkidle0' } );
		} while ( isSame );

		await page.reload( { waitFor: 'networkidle0' } );
	} );

	describe( 'Mailchimp Block', () => {
		it( 'Can publish a post with a Mailchimp Block', async () => {
			const blockEditor = await BlockEditorPage.visit( page );
			const blockInfo = await blockEditor.insertBlock(
				MailchimpBlock.name(),
				MailchimpBlock.title()
			);

			const mcBlock = new MailchimpBlock( blockInfo, page );
			await mcBlock.connect();

			await blockEditor.focus();
			await blockEditor.publishPost();

			await blockEditor.viewPost();
			const frontend = await PostFrontendPage.init( page );
			await frontend.isRenderedBlockPresent( MailchimpBlock );
		} );
	} );

	describe( 'Simple Payment', () => {
		it( 'Can publish a post with a Simple Payments block', async () => {
			const blockEditor = await BlockEditorPage.visit( page );
			const blockInfo = await blockEditor.insertBlock(
				SimplePaymentBlock.name(),
				SimplePaymentBlock.title()
			);

			const spBlock = new SimplePaymentBlock( blockInfo, page );
			await spBlock.fillDetails();

			await blockEditor.focus();
			await blockEditor.publishPost();
			await blockEditor.viewPost();

			const frontend = await PostFrontendPage.init( page );
			await frontend.isRenderedBlockPresent( SimplePaymentBlock );
		} );
	} );

	describe( 'WordAds block', () => {
		it( 'Can publish a post with a WordAds block', async () => {
			const blockEditor = await BlockEditorPage.visit( page );
			// await blockEditor.waitForAvailableBlock( WordAdsBlock.name() );
			const blockInfo = await blockEditor.insertBlock( WordAdsBlock.name(), WordAdsBlock.title() );
			await blockEditor.focus();

			const adBlock = new WordAdsBlock( blockInfo, page );
			await adBlock.focus();
			await adBlock.switchFormat( 3 ); // switch to Wide Skyscraper ad format

			await blockEditor.focus();
			await blockEditor.publishPost();
			await blockEditor.viewPost();

			const frontend = await PostFrontendPage.init( page );
			await frontend.isRenderedBlockPresent( WordAdsBlock );
		} );
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
