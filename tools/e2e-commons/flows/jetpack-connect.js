import { expect } from '@playwright/test';
import config from 'config';
import { persistPlanData, syncPlanData } from '../helpers/plan-helper.js';
import { execWpCommand } from '../helpers/utils-helper.js';
import logger from '../logger.js';
import {
	Sidebar,
	JetpackPage,
	JetpackMyPlanPage,
	RecommendationsPage,
} from '../pages/wp-admin/index.js';
import {
	AuthorizePage,
	PickAPlanPage,
	CheckoutPage,
	ThankYouPage,
	LoginPage,
} from '../pages/wpcom/index.js';

const cardCredentials = config.get( 'testCardCredentials' );

/**
 * Do classic connection
 * @param {page} page - Playwright page instance.
 * @param {string} plan - Plan slug
 */
export async function doClassicConnection( page, plan = 'free' ) {
	const jetpackPage = await JetpackPage.init( page );
	await jetpackPage.connect();
	await (
		await AuthorizePage.init( page )
	).approve( { redirectUrl: 'https://wordpress.com/jetpack/connect/plans/**' } );

	if ( plan === 'free' ) {
		await ( await PickAPlanPage.init( page ) ).select( 'free' );
		await RecommendationsPage.init( page );
	} else {
		await ( await PickAPlanPage.init( page ) ).select( plan );
		await ( await CheckoutPage.init( page ) ).processPurchase( cardCredentials );
		await ( await ThankYouPage.init( page ) ).waitForSetupAndProceed();
	}
}

/**
 * Do site-level connection
 * @param {page} page - Playwright page instance.
 */
export async function doSiteLevelConnection( page ) {
	const jetpackPage = await JetpackPage.init( page );
	await jetpackPage.connect();

	await ( await LoginPage.init( page ) ).continueWithout();
	await ( await PickAPlanPage.init( page ) ).select( 'free' );
	const isPageVisible = await (
		await RecommendationsPage.visit( page )
	).areSiteTypeQuestionsVisible();
	expect( isPageVisible ).toBeTruthy();
	await ( await Sidebar.init( page ) ).selectJetpack();
}

/**
 * Sync Jetpack plan data
 *
 * @param {page} page - Playwright page instance.
 * @param {string} plan - Plan slug.
 * @param {boolean} mockPlanData - Whether to mock plan data.
 */
export async function syncJetpackPlanData( page, plan, mockPlanData = true ) {
	logger.step( `Sync plan data. { plan: ${ plan }, mock: ${ mockPlanData } }` );
	const planType = plan === 'free' ? 'jetpack_free' : 'jetpack_complete';
	await persistPlanData( planType );

	const jpPlanPage = await JetpackMyPlanPage.visit( page );

	if ( ! mockPlanData ) {
		await jpPlanPage.reload();
		await page.waitForResponse(
			response => response.url().match( /v4\/site[^/]/ ) && response.status() === 200,
			{ timeout: 60 * 1000 }
		);
		await execWpCommand( 'cron event run jetpack_v2_heartbeat' );
	}
	await syncPlanData( page );
	if ( ! ( await jpPlanPage.isPlan( plan ) ) ) {
		throw new Error( `Site does not have ${ plan } plan` );
	}
}
