import { test, expect } from '@playwright/test';
import { doSiteLevelConnection, doClassicConnection } from 'jetpack-e2e-commons/flows/index.js';
import { Sidebar, JetpackPage, DashboardPage } from 'jetpack-e2e-commons/pages/wp-admin/index.js';
import { prerequisitesBuilder } from 'jetpack-e2e-commons/env/index.js';

/**
 *
 * @group connection
 */
test.describe( 'Connection', () => {
	test.beforeEach( async ( { page } ) => {
		await prerequisitesBuilder( page )
			.withLoggedIn( true )
			.withWpComLoggedIn( true )
			.withConnection( false )
			.build();
		await DashboardPage.visit( page );
		await ( await Sidebar.init( page ) ).selectJetpack();
	} );

	test.afterEach( async ( { page } ) => {
		await prerequisitesBuilder( page ).withCleanEnv().build();
	} );

	test( 'Site only', async ( { page } ) => {
		await test.step( 'Can clean up WPCOM cookie', async () => {
			await ( await Sidebar.init( page ) ).removeCookieByName( 'wordpress_logged_in' );
		} );

		await test.step( 'Can start Site Level connection', async () => {
			await doSiteLevelConnection( page );
		} );

		await test.step( 'Can assert that site is connected', async () => {
			const jetpackPage = await JetpackPage.init( page );
			expect( await jetpackPage.isConnected() ).toBeTruthy();
		} );
	} );

	test( 'Classic', async ( { page } ) => {
		await test.step( 'Can start classic connection', async () => {
			await doClassicConnection( page, true );
		} );

		await test.step( 'Can assert that site is connected', async () => {
			const jetpackPage = await JetpackPage.init( page );
			expect( await jetpackPage.isConnected() ).toBeTruthy();
		} );
	} );
} );
