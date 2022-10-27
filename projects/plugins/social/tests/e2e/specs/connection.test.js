import { test, expect } from 'jetpack-e2e-commons/fixtures/base-test.js';
import { JetpackSocialPage } from '../pages/index.js';
import { prerequisitesBuilder } from 'jetpack-e2e-commons/env/prerequisites.js';

test.beforeEach( async ( { page } ) => {
	await prerequisitesBuilder( page ).withLoggedIn( true ).withWpComLoggedIn( true ).build();
} );

test( 'Jetpack Social connection', async ( { page } ) => {
	let socialPage;

	await test.step( 'Navigate to Jetpack Social page', async () => {
		socialPage = await JetpackSocialPage.visit( page );
	} );

	await test.step( 'Can start connection', async () => {
		await socialPage.getStarted();

		expect( await socialPage.isConnected(), 'Jetpack Social should be connected' ).toBeTruthy();
	} );
} );
