import { test, expect } from '../../lib/fixtures/test';

test.describe( 'Modern dashboard features', () => {
	test.beforeEach( async ( { boostUtils } ) => {
		await boostUtils.resetEnvironment();
		await boostUtils.setDashboardModernization( true );
		await boostUtils.mockSpeedScore();
	} );

	test.afterEach( async ( { boostUtils } ) => {
		await boostUtils.resetEnvironment();
		await boostUtils.unMockSpeedScore();
	} );

	test( 'Connect from Getting Started and return to modern Settings', async ( {
		boostUtils,
		jetpackBoostPage,
		page,
	} ) => {
		await jetpackBoostPage.visit();
		await expect( page ).toHaveURL( /#\/getting-started$/ );
		await expect( page.locator( '.jetpack-boost-page' ) ).toBeVisible();
		await expect( page.getByRole( 'button', { name: 'Get Boost', exact: true } ) ).toBeVisible();

		const connected = page.waitForResponse(
			response =>
				response.url().includes( '/jetpack-boost/v1/connection' ) &&
				response.request().method() === 'POST',
			{ timeout: 60000 }
		);
		await page.getByRole( 'button', { name: 'Start for free', exact: true } ).click();
		expect( ( await connected ).ok() ).toBeTruthy();
		await expect( page.getByRole( 'tab', { name: 'Settings', exact: true } ) ).toHaveAttribute(
			'aria-selected',
			'true'
		);
		await expect( page.getByTestId( 'module-critical_css' ) ).toBeVisible();
		expect( await boostUtils.isConnected() ).toBe( true );

		await page.reload();
		await expect( page.getByRole( 'tab', { name: 'Settings', exact: true } ) ).toHaveAttribute(
			'aria-selected',
			'true'
		);
		await expect(
			page.getByRole( 'button', { name: 'Start for free', exact: true } )
		).toBeHidden();
	} );

	test( 'Persist Defer Non-Essential JavaScript toggles from modern Settings', async ( {
		boostUtils,
		jetpackBoostPage,
		page,
	} ) => {
		await boostUtils.mockConnection();
		await boostUtils.deactivateBoostModule( 'render_blocking_js' );
		await jetpackBoostPage.visit();
		await page.getByRole( 'tab', { name: 'Settings', exact: true } ).click();
		const checkbox = page.getByTestId( 'module-render_blocking_js' ).getByRole( 'checkbox' );

		await jetpackBoostPage.toggleModule( 'render_blocking_js', true );
		await page.reload();
		await expect( checkbox ).toBeChecked();

		await jetpackBoostPage.toggleModule( 'render_blocking_js', false );
		await page.reload();
		await expect( checkbox ).not.toBeChecked();
	} );

	test( 'Generate Critical CSS after enabling it in modern Settings', async ( {
		boostUtils,
		jetpackBoostPage,
		page,
	} ) => {
		await boostUtils.mockConnection();
		await boostUtils.deactivateBoostModule( 'critical_css' );
		await jetpackBoostPage.visit();
		await page.getByRole( 'tab', { name: 'Settings', exact: true } ).click();
		await expect( page.getByTestId( 'critical-css-meta' ) ).toBeHidden();

		await jetpackBoostPage.toggleModule( 'critical_css', true );
		await expect( page.getByTestId( 'critical-css-meta' ) ).toBeVisible();
		const generate = page.getByRole( 'button', { name: 'Generate', exact: true } );
		await expect( generate ).toBeVisible();

		const generated = jetpackBoostPage.waitForCriticalCssGeneration( 240000 );
		await generate.click();
		await generated;
		await expect( page.getByTestId( 'critical-css-meta' ) ).toBeVisible();
		await expect( page.getByRole( 'button', { name: 'Regenerate', exact: true } ) ).toBeVisible();
	} );
} );
