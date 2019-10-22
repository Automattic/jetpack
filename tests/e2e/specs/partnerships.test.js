/**
 * Internal dependencies
 */
import { getNgrokSiteUrl, provisionJetpackStartConnection } from '../lib/utils-helper';
import LoginPage from '../lib/pages/wpcom/login';
import AuthorizePage from '../lib/pages/wpcom/authorize';
import PlansPage from '../lib/pages/wpcom/plans';

describe( 'Jetpack Start', () => {
	it( 'Can reproduce the unexpected redirect', async () => {
		// remove Sandbox cookie
		await page.deleteCookie( { name: 'store_sandbox', domain: '.wordpress.com' } );

		// Logs in to WPCOM
		const login = await LoginPage.visit( page );
		await login.login( 'defaultUser' );

		// Enable Calypso debugging
		await page.evaluate( () => localStorage.setItem( 'debug', '*' ) );

		const nextUrl = provisionJetpackStartConnection();
		// sometimes after clicking on Approve button below user being redirected to wp-login page
		// maybe waiting for a bit will help?
		await page.waitFor( 10000 );

		await ( await AuthorizePage.visit( page, nextUrl ) ).approve();
		await ( await PlansPage.init( page ) ).isCurrentPlan( 'business' );

		const url = getNgrokSiteUrl();
		console.log( 'NEW SITE URL: ' + url );

		throw new Error( 'Throwing to stop execution!' );
	} );
} );
