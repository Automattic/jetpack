import { prerequisitesBuilder } from '_jetpack-e2e-commons/env/prerequisites.js';
import { test, expect } from '_jetpack-e2e-commons/fixtures/base-test.ts';
import { execWpCommand } from '_jetpack-e2e-commons/helpers/utils-helper.js';
import { disconnect } from '_jetpack-e2e-commons/utils/index.ts';
import { connect } from '../flows/index.js';
import { JetpackSocialPage } from '../pages/index.js';
import playwrightConfig from '../playwright.config.mjs';

test.beforeAll( async ( { browser, requestUtils } ) => {
	await disconnect( requestUtils );
	await execWpCommand( 'option delete jetpack-social_show_pricing_page' );

	const page = await browser.newPage( playwrightConfig.use );
	await prerequisitesBuilder( page )
		.withInactivePlugins( [ 'jetpack' ] )
		.withActivePlugins( [ 'jetpack-social' ] )
		.build();
	await page.close();
} );

test( 'Jetpack Social connection', async ( { page } ) => {
	await test.step( 'Can connect wordpress.com account to Jetpack Social', async () => {
		await connect( page );
		const socialPage = await JetpackSocialPage.init( page );
		expect( await socialPage.isConnected(), 'Jetpack Social should be connected' ).toBeTruthy();
	} );
} );
