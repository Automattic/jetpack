import { prerequisitesBuilder } from 'jetpack-e2e-commons/env/prerequisites.js';
import { test, expect } from '../fixtures/base-test.js';
import { JetpackBoostPage } from '../lib/pages/index.js';
import { boostPrerequisitesBuilder } from '../lib/env/prerequisites.js';

test.describe( 'Settings Page Connection', () => {
	test( 'Should connect to WP.com on a fresh install with Jetpack plugin activated and Jetpack already connected', async ( {
		page,
	} ) => {
		await prerequisitesBuilder().withActivePlugins( [ 'jetpack' ] ).withConnection( true ).build();
		await boostPrerequisitesBuilder().withConnection( false ).build();
		const jetpackBoostPage = await JetpackBoostPage.visit( page );
		expect( await jetpackBoostPage.isAwaitingConnection() ).toBeTruthy();
		await jetpackBoostPage.connect();
		expect( await jetpackBoostPage.isConnected() ).toBeTruthy();
	} );

	test( 'Should connect to WP.com on a fresh install with Jetpack plugin activated', async ( {
		page,
	} ) => {
		await boostPrerequisitesBuilder( page ).withCleanEnv( true ).withConnection( false ).build();
		const jetpackBoostPage = await JetpackBoostPage.visit( page );
		expect( await jetpackBoostPage.isAwaitingConnection() ).toBeTruthy();
		await jetpackBoostPage.connect();
		expect( await jetpackBoostPage.isConnected() ).toBeTruthy();
	} );

	test( 'Should connect to WP.com on a fresh install without Jetpack plugin activated', async ( {
		page,
	} ) => {
		await prerequisitesBuilder().withInactivePlugins( [ 'jetpack' ] ).build();
		await boostPrerequisitesBuilder( page ).withCleanEnv( true ).withConnection( false ).build();
		const jetpackBoostPage = await JetpackBoostPage.visit( page );
		expect( await jetpackBoostPage.isAwaitingConnection() ).toBeTruthy();
		await jetpackBoostPage.connect();
		expect( await jetpackBoostPage.isConnected() ).toBeTruthy();
	} );
} );
