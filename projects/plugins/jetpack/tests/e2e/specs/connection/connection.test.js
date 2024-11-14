import { prerequisitesBuilder } from 'jetpack-e2e-commons/env/index.js';
import { test, expect } from 'jetpack-e2e-commons/fixtures/base-test.js';
import { doSiteLevelConnection, doClassicConnection } from 'jetpack-e2e-commons/flows/index.js';
import {
	Sidebar,
	JetpackDashboardPage,
	DashboardPage,
} from 'jetpack-e2e-commons/pages/wp-admin/index.js';

test.beforeEach( async ( { page } ) => {
	await prerequisitesBuilder( page )
		.withCleanEnv()
		.withLoggedIn( true )
		.withWpComLoggedIn( true )
		.build();
	await DashboardPage.visit( page );
	await ( await Sidebar.init( page ) ).selectJetpackSubMenuItem();
} );

test( 'Site only connection', async ( { page } ) => {
	await test.step( 'Can clean up WPCOM cookie', async () => {
		await ( await Sidebar.init( page ) ).removeCookieByName( 'wordpress_logged_in' );
	} );

	await test.step( 'Can start Site Level connection', async () => {
		await doSiteLevelConnection( page );
	} );

	await test.step( 'Can assert that site is connected', async () => {
		const jetpackPage = await JetpackDashboardPage.visit( page );
		expect( await jetpackPage.isSiteConnected(), 'Site should be connected' ).toBeTruthy();
		expect( await jetpackPage.isNotUserConnected(), 'User should not be connected' ).toBeTruthy();
	} );
} );

test( 'User connection', async ( { page } ) => {
	await test.step( 'Can start classic connection', async () => {
		await doClassicConnection( page );
	} );

	await test.step( 'Can assert that site is connected', async () => {
		const jetpackPage = await JetpackDashboardPage.visit( page );
		expect( await jetpackPage.isSiteConnected(), 'Site should be connected' ).toBeTruthy();
		expect( await jetpackPage.isUserConnected(), 'User should be connected' ).toBeTruthy();
	} );
} );
