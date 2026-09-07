import { test, expect } from '../../lib/fixtures/test';

test.describe( 'Dashboard modernization', () => {
	test.beforeAll( async ( { boostUtils } ) => {
		await boostUtils.resetEnvironment();
		await boostUtils.mockConnection();
		await boostUtils.mockSpeedScore();
	} );

	test.afterEach( async ( { boostUtils } ) => {
		await boostUtils.resetDashboardModernization();
	} );

	test.afterAll( async ( { boostUtils } ) => {
		await boostUtils.unMockConnection();
		await boostUtils.unMockSpeedScore();
	} );

	test( 'Keep the legacy dashboard by default', async ( { jetpackBoostPage, page } ) => {
		await jetpackBoostPage.visit();
		await expect( page.locator( '#jb-admin-settings' ) ).toBeVisible();
		await expect( page.locator( '.jp-admin-page' ) ).toHaveCount( 0 );
		await expect(
			page.locator( '#jetpack-boost-dashboard-wp-admin-prerequisites-js-after' )
		).toHaveCount( 0 );
	} );

	test( 'Keep the legacy dashboard when explicitly disabled', async ( {
		boostUtils,
		jetpackBoostPage,
		page,
	} ) => {
		await boostUtils.setDashboardModernization( false );
		await jetpackBoostPage.visit();
		await expect( page.locator( '#jb-admin-settings' ) ).toBeVisible();
		await expect( page.locator( '.jp-admin-page' ) ).toHaveCount( 0 );
		await expect(
			page.locator( '#jetpack-boost-dashboard-wp-admin-prerequisites-js-after' )
		).toHaveCount( 0 );
	} );

	test( 'Mount one modern dashboard when opted in', async ( {
		boostUtils,
		jetpackBoostPage,
		page,
	} ) => {
		await boostUtils.setDashboardModernization( true );
		await jetpackBoostPage.visit();
		await expect( page.locator( '.jp-admin-page' ) ).toHaveCount( 1 );
		await expect(
			page.locator( '#jetpack-boost-dashboard-wp-admin-prerequisites-js-after' )
		).toHaveCount( 1 );
		await expect( page.getByRole( 'tab', { name: 'Overview', exact: true } ) ).toBeVisible();
		await expect( page.getByRole( 'tab', { name: 'Settings', exact: true } ) ).toBeVisible();
		await expect( page.locator( '#jb-settings-tab-mount' ) ).toHaveCount( 1 );
		await expect( page.locator( '#jb-subpage-mount' ) ).toHaveCount( 1 );
		await expect( page.locator( '#jb-admin-settings' ) ).toHaveCount( 0 );
	} );

	test( 'Keep modern assets off other admin pages', async ( { boostUtils, admin, page } ) => {
		await boostUtils.setDashboardModernization( true );
		await admin.visitAdminPage( 'index.php' );
		await expect(
			page.locator( '#jetpack-boost-dashboard-wp-admin-prerequisites-js-after' )
		).toHaveCount( 0 );
		await expect( page.locator( '.jp-admin-page' ) ).toHaveCount( 0 );
	} );
} );
