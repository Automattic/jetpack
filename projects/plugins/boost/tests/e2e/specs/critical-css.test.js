import { test, expect } from '../fixtures/base-test.js';
import { boostPrerequisitesBuilder } from '../lib/env/prerequisites.js';
import { JetpackBoostPage } from '../lib/pages/index.js';
import { PostFrontendPage } from 'jetpack-e2e-commons/pages/index.js';
import { DashboardPage, ThemesPage, Sidebar } from 'jetpack-e2e-commons/pages/wp-admin/index.js';

test.describe.serial( 'Critical CSS module', () => {
	let page;

	test.beforeAll( async ( { browser } ) => {
		page = await browser.newPage();
		await boostPrerequisitesBuilder( page ).withCleanEnv( true ).withConnection( true ).build();
	} );

	test.afterAll( async ( { browser } ) => {
		page = await browser.newPage();
		await DashboardPage.visit( page );
		await ( await Sidebar.init( page ) ).selectThemes();
		await ( await ThemesPage.init( page ) ).activateTheme( 'twentytwentyone' );
		await page.close();
	} );

	test( 'No Critical CSS meta information should show on the admin when the module is inactive', async () => {
		await boostPrerequisitesBuilder( page ).withInactiveModules( [ 'critical-css' ] ).build();
		const jetpackBoostPage = await JetpackBoostPage.visit( page );
		expect( await jetpackBoostPage.isTheCriticalCssMetaInformationVisible() ).toBeFalsy();
	} );

	test( 'No Critical CSS should be available on the frontend when the module is inactive', async () => {
		await boostPrerequisitesBuilder( page ).withInactiveModules( [ 'critical-css' ] ).build();
		await PostFrontendPage.visit( page );
		expect(
			await page.locator( '#jetpack-boost-critical-css' ).count( {
				timeout: 5 * 1000,
			} )
		).toBe( 0 );
	} );

	// The order of the following tests is important as we are making reuse of the generated Critical CSS
	// which is an onerous task in a test.
	test( 'Critical CSS should be generated when the module is active', async () => {
		await boostPrerequisitesBuilder( page ).withActiveModules( [ 'critical-css' ] ).build();
		const jetpackBoostPage = await JetpackBoostPage.visit( page );
		expect(
			await jetpackBoostPage.WaitForTheCriticalCssGeneratingProgressInformationToBeVisible()
		).toBeTruthy();
		expect( await jetpackBoostPage.waitForTheCriticalCssMetaInformationToBeVisible() ).toBeTruthy();
	} );

	test( 'Critical CSS meta information should show on the admin when the module is re-activated', async () => {
		await boostPrerequisitesBuilder( page ).withInactiveModules( [ 'critical-css' ] ).build();
		await boostPrerequisitesBuilder( page ).withActiveModules( [ 'critical-css' ] ).build();
		const jetpackBoostPage = await JetpackBoostPage.visit( page );
		expect( await jetpackBoostPage.waitForTheCriticalCssMetaInformationToBeVisible() ).toBeTruthy();
	} );

	test( 'Critical CSS should be available on the frontend when the module is active', async () => {
		await PostFrontendPage.visit( page );
		const criticalCss = await page.locator( '#jetpack-boost-critical-css' ).innerText();
		expect( criticalCss.length ).toBeGreaterThan( 100 );
	} );

	test( 'Critical CSS Admin message should show the theme is changed', async () => {
		await boostPrerequisitesBuilder( page ).withActiveModules( [ 'critical-css' ] ).build();
		await DashboardPage.visit( page );
		await ( await Sidebar.init( page ) ).selectThemes();
		const themesPage = await ThemesPage.init( page );
		await ( await ThemesPage.init( page ) ).activateTheme( 'twentytwenty' );
		expect( await page.locator( 'text=Jetpack Boost - Action Required' ).isVisible() ).toBeTruthy();
		await themesPage.click(
			'#jetpack-boost-notice-critical-css-regenerate a[href*="jetpack-boost"]'
		);
		const jetpackBoostPage = await JetpackBoostPage.init( page );
		expect(
			await jetpackBoostPage.WaitForTheCriticalCssGeneratingProgressInformationToBeVisible()
		).toBeTruthy();
		expect( await jetpackBoostPage.waitForTheCriticalCssMetaInformationToBeVisible() ).toBeTruthy();
	} );
} );
