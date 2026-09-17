import { test, expect } from '../../lib/fixtures/test';
import type { Locator } from '@playwright/test';

const topOf = ( locator: Locator ) =>
	locator.evaluate( element => element.getBoundingClientRect().top );

test.describe( 'Dashboard modernization', () => {
	test.beforeAll( async ( { boostUtils } ) => {
		await boostUtils.resetEnvironment();
		await boostUtils.mockConnection();
		await boostUtils.mockSpeedScore();
	} );

	test.afterEach( async ( { boostUtils } ) => {
		await boostUtils.resetDashboardModernization();
		await boostUtils.resetDashboardJitm();
	} );

	test.afterAll( async ( { boostUtils } ) => {
		await boostUtils.unMockConnection();
		await boostUtils.unMockSpeedScore();
	} );

	test( 'Keep the legacy dashboard by default', async ( { jetpackBoostPage, page } ) => {
		await jetpackBoostPage.visit();
		await expect( page.locator( '#jb-admin-settings' ) ).toBeVisible();
		await expect( page.locator( '.jetpack-boost-page' ) ).toHaveCount( 0 );
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
		await expect( page.locator( '.jetpack-boost-page' ) ).toHaveCount( 0 );
		await expect(
			page.locator( '#jetpack-boost-dashboard-wp-admin-prerequisites-js-after' )
		).toHaveCount( 0 );
	} );

	test( 'Mount one modern dashboard when opted in', async ( {
		boostUtils,
		jetpackBoostPage,
		page,
	} ) => {
		const missingConfigErrors: string[] = [];
		page.on( 'console', message => {
			if ( message.text().includes( 'jetpackConfig is missing' ) ) {
				missingConfigErrors.push( message.text() );
			}
		} );

		await boostUtils.setDashboardModernization( true );
		await jetpackBoostPage.visit();
		await expect( page.locator( '.jetpack-boost-page' ) ).toHaveCount( 1 );
		await expect(
			page.locator( '#jetpack-boost-dashboard-wp-admin-prerequisites-js-after' )
		).toHaveCount( 1 );
		await expect( page.getByRole( 'tab', { name: 'Overview', exact: true } ) ).toBeVisible();
		await expect( page.getByRole( 'tab', { name: 'Settings', exact: true } ) ).toBeVisible();
		await expect( page.locator( '#jb-settings-tab-mount' ) ).toHaveCount( 1 );
		await expect( page.locator( '#jb-subpage-mount' ) ).toHaveCount( 1 );

		// The mount is only useful once the webpack app has rendered Settings into it.
		await expect( page.locator( '#jb-settings-tab-mount .jb-modern-settings' ) ).toHaveCount( 1 );
		await expect( page.locator( '#jb-admin-settings' ) ).toHaveCount( 0 );
		expect( missingConfigErrors ).toEqual( [] );
	} );

	test( 'Offer Run speed test in the page header only on the Overview tab', async ( {
		boostUtils,
		jetpackBoostPage,
		page,
	} ) => {
		await boostUtils.setDashboardModernization( true );
		await jetpackBoostPage.visit();
		const runSpeedTest = page
			.locator( '.jetpack-boost-page' )
			.getByRole( 'button', { name: 'Run speed test', exact: true } );
		await expect( runSpeedTest ).toBeVisible();

		await page.getByRole( 'tab', { name: 'Settings', exact: true } ).click();
		await expect( runSpeedTest ).toHaveCount( 0 );

		await page.getByRole( 'tab', { name: 'Overview', exact: true } ).click();
		await expect( runSpeedTest ).toBeVisible();
	} );

	test( 'Show a targeted JITM on the modern dashboard', async ( {
		boostUtils,
		jetpackBoostPage,
		page,
	} ) => {
		await boostUtils.setDashboardModernization( true );
		await boostUtils.setDashboardJitm( true );
		await jetpackBoostPage.visit();
		const notices = page.locator( '#jp-admin-notices' );
		const message = notices.locator( '.jitm-card' );
		const overview = page.locator( '.jetpack-boost-overview' );
		await expect( message ).toBeVisible();
		await expect( message ).toContainText( 'Boost dashboard test message' );
		await expect( overview ).toBeVisible();

		const messageBox = await message.boundingBox();
		const overviewBox = await overview.boundingBox();
		expect( messageBox?.x ).toBeCloseTo( overviewBox?.x ?? NaN, 0 );
		expect( messageBox?.width ).toBeCloseTo( overviewBox?.width ?? NaN, 0 );
		expect( overviewBox?.y ).toBeGreaterThan(
			( messageBox?.y ?? 0 ) + ( messageBox?.height ?? 0 )
		);

		await message.locator( '.jitm-banner__dismiss' ).click();
		await expect( message ).toBeHidden();
		await expect
			.poll( async () => ( await topOf( overview ) ) - ( await topOf( notices ) ) )
			.toBe( 0 );
	} );

	test( 'Collapse empty notices on the modern dashboard', async ( {
		boostUtils,
		jetpackBoostPage,
		page,
	} ) => {
		await boostUtils.setDashboardModernization( true );
		await boostUtils.setDashboardJitm( false );
		await jetpackBoostPage.visit();
		const notices = page.locator( '#jp-admin-notices' );
		const overview = page.locator( '.jetpack-boost-overview' );
		await expect( overview ).toBeVisible();
		await expect( notices ).toHaveCount( 1 );
		await expect( notices ).toBeEmpty();
		await expect
			.poll( async () => ( await topOf( overview ) ) - ( await topOf( notices ) ) )
			.toBe( 0 );
	} );

	test( 'Keep the tabs clickable after scrolling Settings', async ( {
		boostUtils,
		jetpackBoostPage,
		page,
	} ) => {
		await boostUtils.setDashboardModernization( true );
		await jetpackBoostPage.visit();
		const overviewTab = page.getByRole( 'tab', { name: 'Overview', exact: true } );
		await page.getByRole( 'tab', { name: 'Settings', exact: true } ).click();

		const firstGroup = page
			.locator( '.jb-modern-settings' )
			.getByRole( 'heading', { name: 'Code loading optimization', exact: true } );
		await expect( firstGroup ).toBeVisible();
		const tab = ( await overviewTab.boundingBox() )!;

		await firstGroup.hover();
		await page.mouse.wheel( 0, 400 );
		await expect
			.poll( async () => ( await firstGroup.boundingBox() )?.y ?? Infinity )
			.toBeLessThan( tab.y );

		// Locator clicks scroll the target back into view on retry, which would hide the overlap.
		await page.mouse.click( tab.x + tab.width / 2, tab.y + tab.height / 2 );
		await expect( overviewTab ).toHaveAttribute( 'aria-selected', 'true' );
	} );

	test( 'Keep modern assets off other admin pages', async ( { boostUtils, admin, page } ) => {
		await boostUtils.setDashboardModernization( true );
		await admin.visitAdminPage( 'index.php' );
		await expect(
			page.locator( '#jetpack-boost-dashboard-wp-admin-prerequisites-js-after' )
		).toHaveCount( 0 );
		await expect( page.locator( '.jetpack-boost-page' ) ).toHaveCount( 0 );
	} );
} );
