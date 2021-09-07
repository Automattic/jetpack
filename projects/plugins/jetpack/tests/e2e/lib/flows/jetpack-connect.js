import config from 'config';
import Sidebar from '../pages/wp-admin/sidebar';
import JetpackPage from '../pages/wp-admin/jetpack';
import AuthorizePage from '../pages/wpcom/authorize';
import PickAPlanPage from '../pages/wpcom/pick-a-plan';
import CheckoutPage from '../pages/wpcom/checkout';
import ThankYouPage from '../pages/wpcom/thank-you';
import MyPlanPage from '../pages/wpcom/my-plan';
import { execWpCommand } from '../utils-helper';
import { persistPlanData, syncPlanData } from '../plan-helper';
import logger from '../logger';
import RecommendationsPage from '../pages/wp-admin/recommendations';
import LoginPage from '../pages/wpcom/login';

const cardCredentials = config.get( 'testCardCredentials' );

/**
 * Goes through connection flow via classic (calypso) flow
 *
 * @param {Object}  o              Optional object with params such as `plan` and `mockPlanData`
 * @param {string}  o.plan
 * @param {boolean} o.mockPlanData
 */
export async function connectThroughWPAdmin( { plan = 'complete', mockPlanData = false } = {} ) {
	await ( await Sidebar.init( page ) ).selectJetpack();

	const jetpackPage = await JetpackPage.init( page );

	if ( await jetpackPage.isConnected() ) {
		await jetpackPage.openMyPlan();
		if ( await jetpackPage.isPlan( plan ) ) {
			logger.info( 'Site is already connected and has a plan!' );
			return true;
		}
	}

	await doClassicConnection( mockPlanData );
	await syncJetpackPlanData( plan, mockPlanData );
}

export async function doClassicConnection( mockPlanData ) {
	const jetpackPage = await JetpackPage.init( page );
	await jetpackPage.forceVariation( 'original' );
	await jetpackPage.connect();
	// Go through Jetpack connect flow
	await ( await AuthorizePage.init( page ) ).approve();
	if ( mockPlanData ) {
		await ( await PickAPlanPage.init( page ) ).select( 'free' );
		return await ( await Sidebar.init( page ) ).selectJetpack();
	}
	await ( await PickAPlanPage.init( page ) ).select( 'complete' );
	await ( await CheckoutPage.init( page ) ).processPurchase( cardCredentials );
	await ( await ThankYouPage.init( page ) ).waitForSetupAndProceed();
	return await ( await MyPlanPage.init( page ) ).returnToWPAdmin();
}

export async function doSiteLevelConnection() {
	const jetpackPage = await JetpackPage.init( page );
	await jetpackPage.forceVariation( 'original' );
	await jetpackPage.connect();

	await ( await LoginPage.init( page ) ).continueWithout();
	await ( await PickAPlanPage.init( page ) ).select( 'free' );
	const isPageVisible = await (
		await RecommendationsPage.visit( page )
	 ).areSiteTypeQuestionsVisible();
	expect( isPageVisible ).toBeTruthy();
	await ( await Sidebar.init( page ) ).selectJetpack();
}

export async function syncJetpackPlanData( plan, mockPlanData = true ) {
	logger.step( `Sync plan data. { plan: ${ plan }, mock: ${ mockPlanData } }` );
	const planType = plan === 'free' ? 'jetpack_free' : 'jetpack_complete';
	await persistPlanData( planType );

	const jetpackPage = await JetpackPage.visit( page );
	await jetpackPage.openMyPlan();
	await jetpackPage.reload();

	if ( ! mockPlanData ) {
		await jetpackPage.reload();
		await page.waitForResponse(
			response => response.url().match( /v4\/site[^\/]/ ) && response.status() === 200,
			{ timeout: 60 * 1000 }
		);
		await execWpCommand( 'cron event run jetpack_v2_heartbeat' );
	}
	await syncPlanData( page );
	if ( ! ( await jetpackPage.isPlan( plan ) ) ) {
		throw new Error( `Site does not have ${ plan } plan` );
	}
}

export async function isBlogTokenSet() {
	const cliCmd = 'jetpack options get blog_token';
	const result = await execWpCommand( cliCmd );
	if ( typeof result !== 'object' ) {
		return true;
	}
	const txt = result.toString();
	if (
		txt.includes( 'Error: Option not found or is empty' ) ||
		txt.includes( "Error: 'jetpack' is not a registered wp command" )
	) {
		return false;
	}
	throw result;
}
