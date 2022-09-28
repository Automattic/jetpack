import { prerequisitesBuilder } from 'jetpack-e2e-commons/env/prerequisites.js';
import { test, expect } from 'jetpack-e2e-commons/fixtures/base-test.js';
import { JetpackBoostPage } from '../lib/pages/index.js';
import { boostPrerequisitesBuilder } from '../lib/env/prerequisites.js';

test.describe( 'Settings Page Connection', () => {
	test( 'Should be already connected to WP.com on a fresh install with Jetpack plugin activated and Jetpack already connected', async ( {
		page,
	} ) => {
		await prerequisitesBuilder().withActivePlugins( [ 'jetpack' ] ).withConnection( true ).build();
		await boostPrerequisitesBuilder().withConnection( false ).build();
		const jetpackBoostPage = await JetpackBoostPage.visit( page );
		expect( await jetpackBoostPage.isAwaitingConnection(), 'Site should be connected' ).toBeFalsy();
	} );

	test( 'Should connect to WP.com on a fresh install with Jetpack plugin activated', async ( {
		page,
	} ) => {
		await prerequisitesBuilder().withActivePlugins( [ 'jetpack' ] ).withConnection( false ).build();
		await boostPrerequisitesBuilder( page ).withCleanEnv( true ).withConnection( false ).build();
		const jetpackBoostPage = await JetpackBoostPage.visit( page );
		expect(
			await jetpackBoostPage.isAwaitingConnection(),
			'Site should not be connected'
		).toBeTruthy();
		await jetpackBoostPage.connect();
		expect( await jetpackBoostPage.isConnected(), 'Site should be connected' ).toBeTruthy();
	} );

	test( 'Should connect to WP.com on a fresh install without Jetpack plugin activated', async ( {
		page,
	} ) => {
		await prerequisitesBuilder().withInactivePlugins( [ 'jetpack' ] ).build();
		await boostPrerequisitesBuilder( page ).withCleanEnv( true ).withConnection( false ).build();
		const jetpackBoostPage = await JetpackBoostPage.visit( page );
		expect(
			await jetpackBoostPage.isAwaitingConnection(),
			'Site should not be connected'
		).toBeTruthy();
		await jetpackBoostPage.connect();
		expect( await jetpackBoostPage.isConnected(), 'Site should be connected' ).toBeTruthy();
	} );
} );
