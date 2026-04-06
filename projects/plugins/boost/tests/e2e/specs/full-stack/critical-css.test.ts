/**
 * Full-stack Critical CSS generation test.
 *
 * Exercises the complete cloud pipeline:
 * WordPress → Shield → Redis → Hydra (Chromium) → callback → WordPress
 *
 * Requires: Jetpack dev Docker + boost-cloud Docker + boost-developer plugin
 */

import { test, expect, activateBoostModuleDev } from '../../lib/fixtures/full-stack-test';

test.describe.serial( 'Full-stack Critical CSS generation', () => {
	test.beforeAll( async ( { fullStackUtils } ) => {
		await fullStackUtils.resetFullStackEnvironment();

		// Set cloud CSS mode so boost-developer enables the cloud-critical-css feature
		// (Actions.php adds jetpack_boost_has_feature_cloud-critical-css filter when css_mode === 'cloud')
		await fullStackUtils.setBoostDevOption( 'css_mode', 'cloud' );

		// Activating cloud_css triggers Cloud_CSS::activate() → Regenerate::start()
		// via the jetpack_boost_module_status_updated action (added in Step 0b).
		// This sends a CSS generation request to Shield immediately.
		await activateBoostModuleDev( 'cloud_css' );
	} );

	test( 'generates Critical CSS via Shield and Hydra', async ( {
		fullStackUtils,
		jetpackBoostPage,
		page,
	} ) => {
		// Poll WP-CLI for CSS generation completion.
		// Option: jetpack_boost_ds_critical_css_state (wp-js-data-sync.php:17 + class-critical-css.php:92)
		// States: not_generated → pending → generated | error (class-critical-css-state.php:9-14)
		await fullStackUtils.waitForCssGeneration( 120_000 );

		// Verify the admin UI shows generation metadata.
		// Test ID: data-testid="critical-css-meta" (status/status.tsx:59)
		await jetpackBoostPage.visit();
		await expect( page.getByTestId( 'critical-css-meta' ) ).toBeVisible( {
			timeout: 30_000,
		} );
	} );

	test( 'Critical CSS is present on the frontend', async ( { page } ) => {
		await page.goto( '/' );

		// Selector: <style id="jetpack-boost-critical-css"> (class-display-critical-css.php:108)
		const styles = page.locator( '#jetpack-boost-critical-css' );
		await expect( styles ).toBeAttached();

		// textContent() preferred over innerText() for <style> elements (no layout reflow)
		const content = await styles.textContent();
		expect( content?.length ?? 0 ).toBeGreaterThan( 50 );
	} );
} );
