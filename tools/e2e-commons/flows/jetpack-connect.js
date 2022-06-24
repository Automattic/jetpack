import config from 'config';
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
import { execWpCommand } from '../helpers/utils-helper.cjs';
import { persistPlanData, syncPlanData } from '../helpers/plan-helper.js';
import logger from '../logger.cjs';
import { expect } from '@playwright/test';

const cardCredentials = config.get( 'testCardCredentials' );

export async function doClassicConnection( page, freePlan = true ) {
	const jetpackPage = await JetpackPage.init( page );
	await jetpackPage.connect();
	await ( await AuthorizePage.init( page ) ).approve();

	if ( freePlan ) {
		await ( await PickAPlanPage.init( page ) ).select( 'free' );
		await RecommendationsPage.init( page );
	} else {
		await ( await PickAPlanPage.init( page ) ).select( 'complete' );
		await ( await CheckoutPage.init( page ) ).processPurchase( cardCredentials );
		await ( await ThankYouPage.init( page ) ).waitForSetupAndProceed();
	}
}

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

export async function syncJetpackPlanData( page, plan, mockPlanData = true ) {
	logger.step( `Sync plan data. { plan: ${ plan }, mock: ${ mockPlanData } }` );
	const planType = plan === 'free' ? 'jetpack_free' : 'jetpack_complete';
	await persistPlanData( planType );

	const jpPlanPage = await JetpackMyPlanPage.visit( page );

	if ( ! mockPlanData ) {
		await jpPlanPage.reload();
		await page.waitForResponse(
			response => response.url().match( /v4\/site[^\/]/ ) && response.status() === 200,
			{ timeout: 60 * 1000 }
		);
		await execWpCommand( 'cron event run jetpack_v2_heartbeat' );
	}
	await syncPlanData( page );
	if ( ! ( await jpPlanPage.isPlan( plan ) ) ) {
		throw new Error( `Site does not have ${ plan } plan` );
	}
}
