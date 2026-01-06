import { test, expect } from '@playwright/test';

const WP_ADMIN_USER = 'wordpress';
const WP_ADMIN_PASS = 'wordpress';

test.describe( 'mu-wpcom-plugin', () => {
	test.beforeEach( async ( { page } ) => {
		// Login to WordPress admin
		await page.goto( '/wp-login.php' );
		await page.fill( '#user_login', WP_ADMIN_USER );
		await page.fill( '#user_pass', WP_ADMIN_PASS );
		await page.click( '#wp-submit' );
		await page.waitForURL( /wp-admin/ );
	} );

	test( 'Plugin is active and admin is accessible', async ( { page } ) => {
		await test.step( 'Visit dashboard page', async () => {
			await page.goto( '/wp-admin/' );
			await expect(
				page.getByRole( 'heading', { name: 'Dashboard' } ),
				'Dashboard heading should be visible'
			).toBeVisible();
		} );

		await test.step( 'Navigate to plugins page and verify plugin is active', async () => {
			await page.goto( '/wp-admin/plugins.php?plugin_status=active&s=jetpack-mu-wpcom' );
			await expect(
				page.getByRole( 'heading', { name: 'Plugins', level: 1 } ),
				'Plugins heading should be visible'
			).toBeVisible();

			// Target the specific active plugin row (jetpack-mu-wpcom-plugin, not mu-wpcom-plugin)
			const pluginRow = page.locator(
				'tr[data-plugin="jetpack-mu-wpcom-plugin/mu-wpcom-plugin.php"]'
			);
			await expect( pluginRow, 'Plugin row should exist' ).toBeVisible();
			await expect(
				pluginRow.locator( '.deactivate' ),
				'Deactivate link should be present (indicating plugin is active)'
			).toBeVisible();
		} );
	} );

	test( 'Admin pages load without errors', async ( { page } ) => {
		const consoleLogs: string[] = [];
		page.on( 'console', msg => {
			if ( msg.type() === 'error' ) {
				consoleLogs.push( msg.text() );
			}
		} );

		await test.step( 'Visit dashboard', async () => {
			await page.goto( '/wp-admin/' );
			await expect( page.getByRole( 'heading', { name: 'Dashboard' } ) ).toBeVisible();
		} );

		await test.step( 'Visit posts page', async () => {
			await page.goto( '/wp-admin/edit.php' );
			await expect( page.getByRole( 'heading', { name: 'Posts', level: 1 } ) ).toBeVisible();
		} );

		await test.step( 'Check for console errors', async () => {
			const criticalErrors = consoleLogs.filter(
				log =>
					! log.includes( 'Download the React DevTools' ) &&
					! log.includes( 'webpack' ) &&
					! log.includes( 'Failed to load resource' )
			);
			expect(
				criticalErrors.length,
				`Expected no critical console errors, but found: ${ criticalErrors.join( ', ' ) }`
			).toBe( 0 );
		} );
	} );
} );
