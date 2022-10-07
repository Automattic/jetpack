import { test, expect } from 'jetpack-e2e-commons/fixtures/base-test.js';
import { boostPrerequisitesBuilder } from '../lib/env/prerequisites.js';
import { JetpackBoostPage } from '../lib/pages/index.js';
import { PostFrontendPage } from 'jetpack-e2e-commons/pages/index.js';
import { DashboardPage, ThemesPage, Sidebar } from 'jetpack-e2e-commons/pages/wp-admin/index.js';
import playwrightConfig from 'jetpack-e2e-commons/playwright.config.cjs';

test.describe( 'Critical CSS module', () => {
	let page;

	test.beforeAll( async ( { browser } ) => {
		page = await browser.newPage( playwrightConfig.use );
		await boostPrerequisitesBuilder( page )
			.withCleanEnv( true )
			.withConnection( true )
			.withGotStarted()
			.build();
	} );

	test.afterAll( async ( { browser } ) => {
		page = await browser.newPage();
		await DashboardPage.visit( page );
		await ( await Sidebar.init( page ) ).selectThemes();
		await ( await ThemesPage.init( page ) ).activateTheme( 'twentytwentyone' );
		await page.close();
	} );

	// NOTE: The order of the following tests is important as we are making reuse of the generated Critical CSS
	// which is an onerous task in a test.

	test( 'No Critical CSS meta information should show on the admin when the module is inactive', async () => {
		await boostPrerequisitesBuilder( page ).withInactiveModules( [ 'critical-css' ] ).build();
		const jetpackBoostPage = await JetpackBoostPage.visit( page );
		expect(
			await jetpackBoostPage.isTheCriticalCssMetaInformationVisible(),
			'Critical CSS meta information should not be visible'
		).toBeFalsy();
	} );

	test( 'No Critical CSS should be available on the frontend when the module is inactive', async () => {
		await boostPrerequisitesBuilder( page ).withInactiveModules( [ 'critical-css' ] ).build();
		await PostFrontendPage.visit( page );
		expect(
			await page.locator( '#jetpack-boost-critical-css' ).count( {
				timeout: 5 * 1000,
			} ),
			'No Critical CSS should be displayed'
		).toBe( 0 );
	} );

	test( 'Critical CSS should be generated when the module is active', async () => {
		await boostPrerequisitesBuilder( page ).withActiveModules( [ 'critical-css' ] ).build();
		const jetpackBoostPage = await JetpackBoostPage.visit( page );
		expect(
			await jetpackBoostPage.waitForCriticalCssGenerationProgressUIVisibility(),
			'Critical CSS generation progress indicator should be visible'
		).toBeTruthy();
		expect(
			await jetpackBoostPage.waitForCriticalCssMetaInfoVisibility(),
			'Critical CSS meta information should be visible'
		).toBeTruthy();
	} );

	test( 'Critical CSS meta information should show on the admin when the module is re-activated', async () => {
		await boostPrerequisitesBuilder( page ).withInactiveModules( [ 'critical-css' ] ).build();
		await boostPrerequisitesBuilder( page ).withActiveModules( [ 'critical-css' ] ).build();
		const jetpackBoostPage = await JetpackBoostPage.visit( page );
		expect(
			await jetpackBoostPage.waitForCriticalCssMetaInfoVisibility(),
			'Critical CSS meta information should be visible'
		).toBeTruthy();
	} );

	test( 'Critical CSS should be available on the frontend when the module is active', async () => {
		await PostFrontendPage.visit( page );
		const criticalCss = await page.locator( '#jetpack-boost-critical-css' ).innerText();
		expect( criticalCss.length, 'Critical CSS should be displayed' ).toBeGreaterThan( 100 );
	} );

	test( 'Critical CSS Admin message should show when the theme is changed', async () => {
		await boostPrerequisitesBuilder( page ).withActiveModules( [ 'critical-css' ] ).build();
		await DashboardPage.visit( page );
		await ( await Sidebar.init( page ) ).selectThemes();
		const themesPage = await ThemesPage.init( page );
		await themesPage.activateTheme( 'twentytwenty' );
		expect(
			await themesPage.isElementVisible( 'text=Jetpack Boost - Action Required' )
		).toBeTruthy();
		await themesPage.click(
			'#jetpack-boost-notice-critical-css-regenerate a[href*="jetpack-boost"]'
		);
		const jetpackBoostPage = await JetpackBoostPage.init( page );
		expect(
			await jetpackBoostPage.waitForCriticalCssGenerationProgressUIVisibility(),
			'Critical CSS generation progress indicator should be visible'
		).toBeTruthy();
		expect(
			await jetpackBoostPage.waitForCriticalCssMetaInfoVisibility(),
			'Critical CSS meta information should be visible'
		).toBeTruthy();
	} );

	test( 'Critical CSS should be generated with an error (advanced recommendations)', async () => {
		await boostPrerequisitesBuilder( page )
			.withCleanEnv( true )
			.withActiveModules( [ 'critical-css' ] )
			.build();

		// Purposely fail some page requests so Critical CSS will be generated with an error, and we can
		// test scenarios around advanced recommendations.
		await page.route( '**/*', route => {
			const url = route.request().url();
			if ( url.includes( 'page_id' ) ) {
				return route.abort();
			}
			return route.continue();
		} );

		const jetpackBoostPage = await JetpackBoostPage.visit( page );
		expect(
			await jetpackBoostPage.waitForCriticalCssGenerationProgressUIVisibility(),
			'Critical CSS generation progress indicator should be visible'
		).toBeTruthy();
		expect(
			await jetpackBoostPage.waitForCriticalCssMetaInfoVisibility(),
			'Critical CSS meta information should be visible'
		).toBeTruthy();
		expect(
			await jetpackBoostPage.isTheCriticalCssFailureMessageVisible(),
			'Critical CSS failure message should be visible'
		).toBeTruthy();
	} );

	test( 'User can access the Critical advanced recommendations and go back to settings page', async () => {
		await boostPrerequisitesBuilder( page ).withActiveModules( [ 'critical-css' ] ).build();

		const jetpackBoostPage = await JetpackBoostPage.visit( page );
		await jetpackBoostPage.navigateToCriticalCSSAdvancedRecommendations();
		expect(
			await jetpackBoostPage.isCriticalCSSAdvancedRecommendationsVisible(),
			'Critical CSS advanced recommendations should be visible'
		).toBeTruthy();
		await jetpackBoostPage.navigateToMainSettingsPage();
		expect(
			await jetpackBoostPage.isTheCriticalCssMetaInformationVisible(),
			'Critical CSS meta information should be visible'
		).toBeTruthy();
	} );
} );
