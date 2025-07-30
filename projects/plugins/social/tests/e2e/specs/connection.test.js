import { test, expect } from '_jetpack-e2e-commons/fixtures/base-test.ts';
import { connect } from '../flows/index.js';
import { JetpackSocialPage } from '../pages/index.js';

test.beforeAll( async ( { testUtils } ) => {
	await testUtils.disconnect();
	await testUtils.executeWpCommand( 'option delete jetpack-social_show_pricing_page' );
	await testUtils.requestUtils.deactivatePlugin( 'jetpack' );
	await testUtils.requestUtils.activatePlugin( 'jetpack-social' );
} );

test( 'Jetpack Social connection', async ( { page } ) => {
	await test.step( 'Can connect wordpress.com account to Jetpack Social', async () => {
		await connect( page );
		const socialPage = await JetpackSocialPage.init( page );
		expect( await socialPage.isConnected(), 'Jetpack Social should be connected' ).toBeTruthy();
	} );
} );
