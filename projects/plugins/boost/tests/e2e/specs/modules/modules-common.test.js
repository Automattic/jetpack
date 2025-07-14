import { test, expect } from '_jetpack-e2e-commons/fixtures/base-test.js';
import playwrightConfig from '_jetpack-e2e-commons/playwright.config.mjs';
import { boostPrerequisitesBuilder } from '../../lib/env/prerequisites.js';
import { JetpackBoostPage } from '../../lib/pages/index.js';

const modules = [
	// ['MODULE_NAME', 'DEFAULT STATE'],
	[ 'critical_css', 'enabled' ],
	[ 'render_blocking_js', 'disabled' ],
];

test.describe.serial( 'Modules', () => {
	let page;
	let jetpackBoostPage;

	test.beforeAll( async ( { browser } ) => {
		page = await browser.newPage( playwrightConfig.use );

		await boostPrerequisitesBuilder( page )
			.withCleanEnv()
			.withConnection( true )
			.withSpeedScoreMocked( true )
			.build();
		jetpackBoostPage = await JetpackBoostPage.visit( page );
	} );

	test.afterAll( async () => {
		await page.close();
	} );

	modules.forEach( ( [ moduleSlug, moduleState ] = module ) => {
		test( `The ${ moduleSlug } module should be ${ moduleState } by default`, async () => {
			expect(
				await jetpackBoostPage.waitForModuleState( moduleSlug, moduleState === 'enabled' ),
				`${ moduleSlug } should be enabled`
			).toBeTruthy();
		} );

		test( `The ${ moduleSlug } module state should toggle to an inverse state`, async () => {
			await jetpackBoostPage.toggleModule( moduleSlug, moduleState !== 'enabled' );
			expect(
				await jetpackBoostPage.waitForModuleState( moduleSlug, moduleState !== 'enabled' ),
				`${ moduleSlug } should be enabled`
			).toBeTruthy();
		} );

		test( `The ${ moduleSlug } module state should revert back to original state`, async () => {
			await jetpackBoostPage.toggleModule( moduleSlug, moduleState === 'enabled' );

			expect(
				await jetpackBoostPage.waitForModuleState( moduleSlug, moduleState === 'enabled' ),
				`${ moduleSlug } should be enabled`
			).toBeTruthy();
		} );
	} );
} );
