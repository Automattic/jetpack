/**
 * Internal dependencies
 */
import BlockEditorPage from '../lib/pages/wp-admin/block-editor';
import PostFrontendPage from '../lib/pages/postFrontend';
import WordAdsBlock from '../lib/blocks/word-ads';
import {
	connectThroughJetpackStart,
	connectThroughWPAdminIfNeeded,
} from '../lib/flows/jetpack-connect';
import { execShellCommand, resetWordpressInstall, getNgrokSiteUrl } from '../lib/utils-helper';
import { isEventuallyPresent, logHTML } from '../lib/page-helper';
import { sendSnippetToSlack } from '../lib/reporters/slack';

// Activate WordAds module if in CI
async function activateWordAdsModule() {
	let cmd = './tests/e2e/docker/whatever.sh cli "wp jetpack module activate wordads"';
	if ( process.env.CI ) {
		cmd = 'wp jetpack module activate wordads --path="/home/travis/wordpress"';
	}

	await execShellCommand( cmd );
}

async function saveNetworkRequests( results ) {
	let paused = false;
	const pausedRequests = [];

	const nextRequest = () => {
		// continue the next request or "unpause"
		if ( pausedRequests.length === 0 ) {
			paused = false;
		} else {
			// continue first request in "queue"
			pausedRequests.shift()(); // calls the request.continue function
		}
	};

	await page.setRequestInterception( true );
	page.on( 'request', request => {
		if ( paused ) {
			pausedRequests.push( () => request.continue() );
		} else {
			paused = true; // pause, as we are processing a request now
			request.continue();
		}
	} );

	page.on( 'requestfinished', async request => {
		const response = await request.response();

		const responseHeaders = response.headers();
		let responseBody;
		if ( request.redirectChain().length === 0 ) {
			// body can only be access for non-redirect responses
			responseBody = await response.buffer();
			if ( responseBody.type && responseBody.type === 'Buffer' ) {
				responseBody = Buffer.from( responseBody.data ).toString();
			}
		}

		const information = {
			url: request.url(),
			requestHeaders: request.headers(),
			requestPostData: request.postData(),
			responseHeaders,
			responseSize: responseHeaders[ 'content-length' ],
			responseBody,
		};
		results.push( information );

		nextRequest(); // continue with next request
	} );

	page.on( 'requestfailed', () => {
		// handle failed request
		nextRequest();
	} );
}

describe( 'WordAds block', () => {
	beforeAll( async () => {
		await resetWordpressInstall();
		const url = getNgrokSiteUrl();
		console.log( 'NEW SITE URL: ' + url );
	} );

	it( 'TEST', async () => {
		// await connectThroughJetpackStart();
		await connectThroughWPAdminIfNeeded();
		// Can activate WordAds module
		// await page.waitFor( 5000 );

		await activateWordAdsModule();
		await execShellCommand( 'wp option get wordads_approved --path="/home/travis/wordpress"' );
		// await page.waitFor( 5000 );

		const blockEditor = await BlockEditorPage.visit( page );
		const blockInfo = await blockEditor.insertBlock( WordAdsBlock.name() );

		const adBlock = new WordAdsBlock( blockInfo, page );
		await adBlock.switchFormat( 3 ); // switch to Wide Skyscraper ad format

		await blockEditor.focus();

		await page.setCacheEnabled( false );
		await blockEditor.publishPost();

		// const res = [];
		// await saveNetworkRequests( res );
		await blockEditor.viewPost();

		// const res = [];
		// await saveNetworkRequests( res );

		// console.log( new Date() );

		// const httpURL = getNgrokSiteUrl().replace( 'https', 'http' );
		// await page.goto( httpURL, { timeout: 90000 } );

		// await logHTML();

		// await page.reload( { waitFor: 'networkidle0' } );
		// await logHTML();
		// await sendSnippetToSlack( JSON.stringify( res ) );

		const frontend = await PostFrontendPage.init( page );
		await frontend.isRenderedBlockPresent( WordAdsBlock );
	} );

	it.skip( 'Can publish a post with a WordAds block', async () => {
		await connectThroughJetpackStart();
		// Can activate WordAds module
		await activateWordAdsModule();
		await execShellCommand( 'wp option get wordads_approved --path="/home/travis/wordpress"' );

		await page.waitFor( 30000 );
		const blockEditor = await BlockEditorPage.visit( page );
		const blockInfo = await blockEditor.insertBlock( WordAdsBlock.name() );

		const adBlock = new WordAdsBlock( blockInfo, page );
		await adBlock.switchFormat( 3 ); // switch to Wide Skyscraper ad format

		await blockEditor.focus();

		await page.setCacheEnabled( false );
		await blockEditor.publishPost();

		// const res = [];
		// await saveNetworkRequests( res );
		await blockEditor.viewPost();

		const frontend = await PostFrontendPage.init( page );
		// const url = page.url();
		// await frontend.logout();

		// await page._client.send( 'Network.clearBrowserCookies' );

		// await page.reload( { waitFor: 'networkidle0' } );

		// frontend = await PostFrontendPage.visit( page, url );
		// frontend.reloadUntil( async () => {
		// 	const r = await execShellCommand(
		// 		'wp option get jetpack_active_plan --path="/home/travis/wordpress"'
		// 	);
		// 	return typeof r === 'string' ? false : true;
		// } );

		await page.reload( { waitFor: 'networkidle0' } );

		await logHTML();
		// await sendSnippetToSlack( JSON.stringify( res ) );

		// frontend.reloadUntil(
		// 	async () => ! ( await isEventuallyPresent( page, '.entry-content iframe[src*="wordads"]' ) )
		// );

		// frontend = await PostFrontendPage.visit( page, url );

		await frontend.isRenderedBlockPresent( WordAdsBlock );
	} );
} );
