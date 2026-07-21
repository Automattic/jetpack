import { test, expect } from '../../lib/fixtures/test';

test.describe( 'Concatenate JS and CSS', () => {
	test.beforeAll( async ( { boostUtils } ) => {
		await boostUtils.resetEnvironment();
		await boostUtils.mockConnection();
		await boostUtils.mockSpeedScore();
	} );

	test.afterAll( async ( { boostUtils } ) => {
		await boostUtils.unMockConnection();
		await boostUtils.unMockSpeedScore();
	} );

	test( 'No Concatenate meta information should show on the admin when the modules are inactive', async ( {
		boostUtils,
		jetpackBoostPage,
		page,
	} ) => {
		await test.step( 'Deactivate minify_js and minify_css modules and visit Boost page', async () => {
			await boostUtils.deactivateBoostModule( [ 'minify_js', 'minify_css' ] );
			await jetpackBoostPage.visit();
		} );

		await expect(
			page.getByTestId( 'meta-minify_js_excludes' ),
			'Concatenate JS meta information should not be visible'
		).toBeHidden();
		await expect(
			page.getByTestId( 'meta-minify_css_excludes' ),
			'Concatenate CSS meta information should not be visible'
		).toBeHidden();
	} );

	test( 'Concatenation shouldn`t occur when the modules are inactive', async ( {
		boostUtils,
		page,
	} ) => {
		await test.step( 'Deactivate minify_js and minify_css modules, setup assets and visit homepage', async () => {
			await boostUtils.deactivateBoostModule( [ 'minify_js', 'minify_css' ] );
			await boostUtils.executeWpCommand(
				'plugin activate e2e-concatenate-enqueue/e2e-concatenate-enqueue.php'
			);
			await page.goto( '/' );
		} );

		// This script is enqueued via a helper plugin.
		await expect(
			page.locator( '#e2e-script-one-js' ).first(),
			'JS concatenation shouldn`t occur when the module is inactive'
		).toBeAttached();
		// This style is enqueued via a helper plugin.
		await expect(
			page.locator( '#e2e-style-one-css' ).first(),
			'CSS concatenation shouldn`t occur when the module is inactive'
		).toBeAttached();
	} );

	test( 'Meta information should be visible when the modules are active', async ( {
		boostUtils,
		page,
		jetpackBoostPage,
	} ) => {
		await test.step( 'Activate minify_js and minify_css modules', async () => {
			await boostUtils.activateBoostModule( [ 'minify_js', 'minify_css' ] );
			await jetpackBoostPage.visit();
		} );

		await expect(
			page.getByTestId( 'meta-minify_css_excludes' ),
			'Concatenate CSS meta information should be visible'
		).toBeVisible();
	} );

	test( 'Concatenation occurs when modules are active', async ( { boostUtils, page } ) => {
		await test.step( 'Activate minify_js and minify_css modules, setup assets and visit homepage', async () => {
			await boostUtils.activateBoostModule( [ 'minify_js', 'minify_css' ] );
			await boostUtils.executeWpCommand(
				'plugin activate e2e-concatenate-enqueue/e2e-concatenate-enqueue.php'
			);
			await page.goto( '/' );
		} );

		// e2e-script-one and e2e-script-two are enqueued by a helper plugin. When concatenation is enabled,
		// they should be concatenated into a single script.
		await expect(
			page.locator( '[data-handles*="e2e-script-one"][data-handles*="e2e-script-two"]' ).first(),
			'JS Concatenation occurs when module is active'
		).toBeAttached();

		// e2e-style-one and e2e-style-two are enqueued by a helper plugin. When concatenation is enabled,
		// they should be concatenated into a single style.
		await expect(
			page.locator( '[data-handles*="e2e-style-one"][data-handles*="e2e-style-two"]' ).first(),
			'CSS Concatenation occurs when module is active'
		).toBeAttached();
	} );

	test( 'Assets that are excluded by default shouldn`t be concatenated', async ( {
		boostUtils,
		page,
	} ) => {
		await test.step( 'Activate minify_js and minify_css modules, setup assets and visit homepage', async () => {
			await boostUtils.activateBoostModule( [ 'minify_js', 'minify_css' ] );
			await boostUtils.executeWpCommand(
				'plugin activate e2e-concatenate-enqueue/e2e-concatenate-enqueue.php'
			);
			await page.goto( '/' );
		} );

		// jQuery is enqueued by a helper plugin.
		await expect(
			page.locator( '#jquery-core-js' ).first(),
			'jQuery should not be concatenated'
		).toBeAttached();

		// Admin bar stylesheet is enqueued by default when logged-in.
		await expect(
			page.locator( '#admin-bar-css' ).first(),
			'Admin bar stylesheet should not be concatenated'
		).toBeAttached();
	} );
} );
