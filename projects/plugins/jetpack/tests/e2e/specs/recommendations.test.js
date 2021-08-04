import { step } from '../lib/env/test-setup';
import RecommendationsPage from '../lib/pages/wp-admin/recommendations';
import { prerequisitesBuilder } from '../lib/env/prerequisites';

/**
 *
 * @group post-connection
 * @group recommendations
 */
describe( 'Recommendations (Jetpack Assistant)', () => {
	beforeAll( async () => {
		await prerequisitesBuilder().withConnection( true ).build();
	} );

	it( 'Recommendations (Jetpack Assistant)', async () => {
		let recommendationsPage;

		await step( 'Navigate to the Recommendations module', async () => {
			recommendationsPage = await RecommendationsPage.visit( page );
			const isPageVisible = await recommendationsPage.areSiteTypeQuestionsVisible();
			expect( isPageVisible ).toBeTruthy();
			expect( recommendationsPage.isUrlInSyncWithStepName( 'site-type' ) ).toBeTruthy();
		} );

		await step( 'Check Personal and Other checkboxes', async () => {
			await recommendationsPage.checkPersonalSiteType();
			await recommendationsPage.checkOtherSiteType();
			expect( await recommendationsPage.isPersonalSiteTypeChecked() ).toBeTruthy();
			expect( await recommendationsPage.isOtherSiteTypeChecked() ).toBeTruthy();
			expect( await recommendationsPage.isBusinessTypeUnchecked() ).toBeFalsy();
			expect( await recommendationsPage.isStoreTypeUnchecked() ).toBeFalsy();
		} );

		await step( 'Save answers and continue to the Monitor step', async () => {
			await recommendationsPage.saveSiteTypeAndContinue();
			await recommendationsPage.reload();
			await recommendationsPage.waitForNetworkIdle();
			const isMonitorStep = await recommendationsPage.isEnableMonitoringButtonVisible();
			expect( isMonitorStep ).toBeTruthy();
			expect( recommendationsPage.isUrlInSyncWithStepName( 'monitor' ) ).toBeTruthy();
		} );

		await step( 'Enable Monitoring and continue to Related Post step', async () => {
			await recommendationsPage.enableMonitoringAndContinue();
			await recommendationsPage.reload();
			await recommendationsPage.waitForNetworkIdle();
			const isRelatedPostsStep = await recommendationsPage.isEnableRelatedPostsButtonVisible();
			expect( isRelatedPostsStep ).toBeTruthy();
			expect( recommendationsPage.isUrlInSyncWithStepName( 'related-posts' ) ).toBeTruthy();
		} );

		await step( 'Enable Related Posts and continue to Creative Mail step', async () => {
			await recommendationsPage.enableRelatedPostsAndContinue();
			await recommendationsPage.reload();
			await recommendationsPage.waitForNetworkIdle();
			const isCreativeMailStep = await recommendationsPage.isInstallCreativeMailButtonVisible();
			expect( isCreativeMailStep ).toBeTruthy();
			expect( recommendationsPage.isUrlInSyncWithStepName( 'creative-mail' ) ).toBeTruthy();
		} );

		await step( 'Skip Creative Mail and continue to Site Accelerator', async () => {
			await recommendationsPage.skipCreativeMailAndContinue();
			await recommendationsPage.reload();
			await recommendationsPage.waitForNetworkIdle();
			const isSiteAcceleratorStep = await recommendationsPage.isEnableSiteAcceleratorButtonVisible();
			expect( isSiteAcceleratorStep ).toBeTruthy();
			expect( recommendationsPage.isUrlInSyncWithStepName( 'site-accelerator' ) ).toBeTruthy();
		} );

		await step( 'Skip Site Accelerator and continue to Summary', async () => {
			await recommendationsPage.skipSiteAcceleratorAndContinue();
			await recommendationsPage.reload();
			await recommendationsPage.waitForNetworkIdle();
			const isSummaryContent = await recommendationsPage.isSummaryContentVisible();
			const isSummarySidebar = await recommendationsPage.isSummarySidebarVisible();
			expect( isSummaryContent && isSummarySidebar ).toBeTruthy();
			expect( recommendationsPage.isUrlInSyncWithStepName( 'summary' ) ).toBeTruthy();
		} );

		await step( 'Verify Monitoring and Related Posts are enabled', async () => {
			const isMonitoringFeatureEnabled = await recommendationsPage.isMonitoringFeatureEnabled();
			const isRelatedPostsFeatureEnabled = await recommendationsPage.isRelatedPostsFeatureEnabled();
			expect( isMonitoringFeatureEnabled && isRelatedPostsFeatureEnabled ).toBeTruthy();
		} );

		await step( 'Verify Creative Mail and Site Accelerator are disabled', async () => {
			const isCreativeMailFeatureEnabled = await recommendationsPage.isCreativeMailFeatureEnabled();
			const isSiteAcceleratorFeatureEnabled = await recommendationsPage.isSiteAcceleratorFeatureEnabled();
			expect( isCreativeMailFeatureEnabled && isSiteAcceleratorFeatureEnabled ).toBeTruthy();
		} );
	} );
} );
