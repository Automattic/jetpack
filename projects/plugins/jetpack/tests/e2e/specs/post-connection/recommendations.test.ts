import { test, expect } from '@automattic/_jetpack-e2e-commons/fixtures/base-test';

test.beforeEach( async ( { testUtils } ) => {
	const cleanupCMDs = [
		'jetpack module deactivate monitor',
		'jetpack module deactivate related-posts',
		'jetpack module deactivate subscriptions',
	];

	for ( const cmd of cleanupCMDs ) {
		await testUtils.executeWpCommand( cmd );
	}

	// Reset the recommendations data
	await testUtils.requestUtils.rest( {
		method: 'POST',
		path: '/jetpack/v4/recommendations/data',
		data: {
			data: {
				onboardingViewed: [],
				selectedRecommendations: [],
				skippedRecommendations: [],
				viewedRecommendations: [],
			},
		},
	} );
} );

test( 'Recommendations (Jetpack Assistant)', async ( { page } ) => {
	await test.step( 'Navigate to the Recommendations module', async () => {
		await page.goto( '/wp-admin/admin.php?page=jetpack#/recommendations' );

		await expect( page, 'URL should be in sync with the step name' ).toHaveURL(
			/recommendations\/site-type/
		);
	} );

	await test.step( 'Check Personal and Other checkboxes', async () => {
		await page.getByRole( 'checkbox', { name: 'This is a personal site' } ).check();

		await expect(
			page.getByRole( 'checkbox', { name: 'This is a personal site' } ),
			'Personal site type should be checked'
		).toBeChecked();
		await expect(
			page.getByRole( 'checkbox', { name: 'This is an e-commerce site' } ),
			'Business type should be checked'
		).not.toBeChecked();
		await expect(
			page.getByRole( 'checkbox', { name: 'I build or manage this site' } ),
			'Store type should be checked'
		).not.toBeChecked();
	} );

	await test.step( 'Enable Monitoring and continue to Related Post step', async () => {
		await page.getByRole( 'link', { name: 'Continue' } ).click();
		await page.reload();

		await expect(
			page.getByRole( 'link', { name: 'Enable Downtime Monitoring' } ),
			'Monitor step should be visible'
		).toBeVisible();
		await expect( page, 'URL should be in sync with the step name' ).toHaveURL(
			/recommendations\/monitor/
		);

		await page.getByRole( 'link', { name: 'Enable Downtime Monitoring' } ).click();
		await page.reload();

		await expect(
			page.getByRole( 'link', { name: 'Enable Related Posts' } ),
			'Related posts step should be visible'
		).toBeVisible();
		await expect( page, 'URL should be in sync with the step name' ).toHaveURL(
			/recommendations\/related-posts/
		);
	} );

	await test.step( 'Enable Related Posts and continue to Newsletter step', async () => {
		await page.getByRole( 'link', { name: 'Enable Related Posts' } ).click();
		await page.reload();

		await expect(
			page.getByRole( 'link', { name: 'Enable Newsletter' } ),
			'Newsletter step should be visible'
		).toBeVisible();
		await expect( page, 'URL should be in sync with the step name' ).toHaveURL(
			/recommendations\/newsletter/
		);
	} );

	await test.step( 'Enable Newsletter and continue to Site Accelerator', async () => {
		await page.getByRole( 'link', { name: 'Enable Newsletter' } ).click();
		await page.reload();

		await expect(
			page.getByRole( 'link', { name: 'Enable Site Accelerator' } ),
			'Site Accelerator step should be visible'
		).toBeVisible();
		await expect( page, 'URL should be in sync with the step name' ).toHaveURL(
			/recommendations\/site-accelerator/
		);
	} );

	await test.step( 'Skip Site Accelerator and continue to VaultPress Backup card', async () => {
		await page.getByRole( 'link', { name: 'Not now' } ).click();
		await page.reload();

		await expect(
			page.getByRole( 'link', { name: 'Get' } ),
			'VaultPress Backup step should be visible'
		).toBeVisible();
		await expect( page, 'URL should be in sync with the step name' ).toHaveURL(
			/recommendations\/vaultpress-backup/
		);
	} );

	await test.step( 'Skip VaultPress Backup card and continue to Summary', async () => {
		await page.getByRole( 'link', { name: 'Not now' } ).click();
		await page.reload();

		await expect(
			page.locator( '.jp-recommendations-summary__content' ),
			'Summary content should be visible'
		).toBeVisible();
		await expect(
			page.locator( '.jp-recommendations-summary__sidebar' ),
			'Summary sidebar should be visible'
		).toBeVisible();

		await expect( page, 'URL should be in sync with the step name' ).toHaveURL(
			/recommendations\/summary/
		);
	} );

	await test.step( 'Verify Monitoring, Newsletter, and Related Posts are enabled', async () => {
		await expect(
			page.locator(
				'.jp-recommendations-feature-summary.is-feature-enabled >> a >> text="Downtime Monitoring"'
			),
			'Monitoring feature should be enabled'
		).toBeVisible();

		await expect(
			page.locator(
				'.jp-recommendations-feature-summary.is-feature-enabled >> a >> text="Related Posts"'
			),
			'Related Posts should be enabled'
		).toBeVisible();

		await expect(
			page.locator(
				'.jp-recommendations-feature-summary.is-feature-enabled >> a >> text="Newsletter"'
			),
			'Newsletter should be enabled'
		).toBeVisible();
	} );

	await test.step( 'Verify Site Accelerator is disabled', async () => {
		const isSiteAcceleratorFeatureEnabled = page.locator(
			'.jp-recommendations-feature-summary:not(.is-feature-enabled) >> a >> text="Site Accelerator"'
		);
		await expect(
			isSiteAcceleratorFeatureEnabled,
			'Site Accelerator should be disabled'
		).toBeVisible();
	} );
} );
