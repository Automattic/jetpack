import { expect } from '@playwright/test';
import config from 'config';
import { Sidebar, JetpackPage, RecommendationsPage } from '../pages/wp-admin/index.js';
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
 * @param {page}   page - Playwright page instance.
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
