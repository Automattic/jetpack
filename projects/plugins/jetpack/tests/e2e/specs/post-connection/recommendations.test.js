import { Plans, prerequisitesBuilder } from 'jetpack-e2e-commons/env/index.js';
import { test, expect } from 'jetpack-e2e-commons/fixtures/base-test.js';
import { RecommendationsPage } from 'jetpack-e2e-commons/pages/wp-admin/index.js';
import playwrightConfig from '../../playwright.config.mjs';

test.beforeAll( async ( { browser } ) => {
	const page = await browser.newPage( playwrightConfig.use );
	await prerequisitesBuilder( page )
		.withCleanEnv()
		.withLoggedIn( true )
		.withWpComLoggedIn( true )
		.withConnection( true )
		.withPlan( Plans.Free )
		.build();
	await page.close();
} );

test( 'Recommendations (Jetpack Assistant)', async ( { page } ) => {
	let recommendationsPage;

	await test.step( 'Navigate to the Recommendations module', async () => {
		recommendationsPage = await RecommendationsPage.visit( page );
		const isPageVisible = await recommendationsPage.areSiteTypeQuestionsVisible();
		expect( isPageVisible, 'Site type questions should be visible' ).toBeTruthy();
		expect(
			recommendationsPage.isUrlInSyncWithStepName( 'site-type' ),
			'URL should be in sync with the step name'
		).toBeTruthy();
	} );

	await test.step( 'Check Personal and Other checkboxes', async () => {
		await recommendationsPage.checkPersonalSiteType();
		expect(
			await recommendationsPage.isPersonalSiteTypeChecked(),
			'Personal site type should be checked'
		).toBeTruthy();
		expect(
			await recommendationsPage.isAgencyTypeUnchecked(),
			'Business type should be checked'
		).toBeFalsy();
		expect(
			await recommendationsPage.isStoreTypeUnchecked(),
			'Store type should be checked'
		).toBeFalsy();
	} );

	await test.step( 'Enable Monitoring and continue to Related Post step', async () => {
		await recommendationsPage.saveSiteTypeAndContinue();
		await recommendationsPage.reload();
		const isMonitorStep = await recommendationsPage.isEnableMonitoringButtonVisible();
		expect( isMonitorStep, 'Monitor step should be visible' ).toBeTruthy();
		expect(
			recommendationsPage.isUrlInSyncWithStepName( 'monitor' ),
			'URL should be in sync with the step name'
		).toBeTruthy();
		await recommendationsPage.enableMonitoringAndContinue();
		await recommendationsPage.reload();
		const isRelatedPostsStep = await recommendationsPage.isEnableRelatedPostsButtonVisible();
		expect( isRelatedPostsStep, 'Related posts step should be visible' ).toBeTruthy();
		expect(
			recommendationsPage.isUrlInSyncWithStepName( 'related-posts' ),
			'URL should be in sync with the step name'
		).toBeTruthy();
	} );

	await test.step( 'Enable Related Posts and continue to Newsletter step', async () => {
		await recommendationsPage.enableRelatedPostsAndContinue();
		await recommendationsPage.reload();
		const isNewsletterStep = await recommendationsPage.isEnableNewsletterButtonVisible();
		expect( isNewsletterStep, 'Newsletter step should be visible' ).toBeTruthy();
		expect(
			recommendationsPage.isUrlInSyncWithStepName( 'newsletter' ),
			'URL should be in sync with the step name'
		).toBeTruthy();
	} );

	await test.step( 'Enable Newsletter and continue to Site Accelerator', async () => {
		await recommendationsPage.enableNewsletterAndContinue();
		await recommendationsPage.reload();
		const isSiteAcceleratorStep = await recommendationsPage.isEnableSiteAcceleratorButtonVisible();
		expect( isSiteAcceleratorStep, 'Site Accelerator step should be visible' ).toBeTruthy();
		expect(
			recommendationsPage.isUrlInSyncWithStepName( 'site-accelerator' ),
			'URL should be in sync with the step name'
		).toBeTruthy();
	} );

	await test.step( 'Skip Site Accelerator and continue to VaultPress Backup card', async () => {
		await recommendationsPage.skipSiteAcceleratorAndContinue();
		await recommendationsPage.reload();
		const isVaultPressBackupStep = await recommendationsPage.isTryVaultPressBackupButtonVisible();
		expect( isVaultPressBackupStep, 'VaultPress Backup step should be visible' ).toBeTruthy();
		expect(
			recommendationsPage.isUrlInSyncWithStepName( 'vaultpress-backup' ),
			'URL should be in sync with the step name'
		).toBeTruthy();
	} );

	await test.step( 'Skip VaultPress Backup card and continue to Summary', async () => {
		await recommendationsPage.skipVaultPressBackupAndContinue();
		await recommendationsPage.reload();
		const isSummaryContent = await recommendationsPage.isSummaryContentVisible();
		const isSummarySidebar = await recommendationsPage.isSummarySidebarVisible();
		expect(
			isSummaryContent && isSummarySidebar,
			'Summary content and Summary sidebar should be visible'
		).toBeTruthy();
		expect(
			recommendationsPage.isUrlInSyncWithStepName( 'summary' ),
			'URL should be in sync with the step name'
		).toBeTruthy();
	} );

	await test.step( 'Verify Monitoring, Newsletter, and Related Posts are enabled', async () => {
		const isMonitoringFeatureEnabled = await recommendationsPage.isMonitoringFeatureEnabled();
		const isRelatedPostsFeatureEnabled = await recommendationsPage.isRelatedPostsFeatureEnabled();
		const isNewsletterFeatureEnabled = await recommendationsPage.isNewsletterFeatureEnabled();
		expect(
			isMonitoringFeatureEnabled && isNewsletterFeatureEnabled && isRelatedPostsFeatureEnabled,
			'Monitoring feature, Newsletter, and Related Posts should be enabled'
		).toBeTruthy();
	} );

	await test.step( 'Verify Site Accelerator is disabled', async () => {
		const isSiteAcceleratorFeatureEnabled =
			await recommendationsPage.isSiteAcceleratorFeatureEnabled();
		expect( isSiteAcceleratorFeatureEnabled, 'Site Accelerator should be disabled' ).toBeTruthy();
	} );
} );
