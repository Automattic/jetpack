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

	test( 'Mount the modern dashboard by default', async ( {
		boostUtils,
		jetpackBoostPage,
		page,
	} ) => {
		await boostUtils.resetDashboardModernization();
		await jetpackBoostPage.visit();
		await expect( page.locator( '.jetpack-boost-page' ) ).toHaveCount( 1 );
		await expect( page.locator( '#jb-settings-tab-mount .jb-modern-settings' ) ).toHaveCount( 1 );
		await expect( page.locator( '#jb-admin-settings' ) ).toHaveCount( 0 );
	} );

	test( 'Restore the legacy dashboard when the filter returns false', async ( {
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

	test( 'Mount one modern dashboard when explicitly enabled', async ( {
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
		await expect( page.getByRole( 'tab' ) ).toHaveCount( 0 );
		await expect( page.getByRole( 'tabpanel' ) ).toHaveCount( 0 );
		await expect( page.getByRole( 'heading', { name: 'Optimize your speed' } ) ).toBeVisible();
		await expect( page.locator( '#jb-settings-tab-mount' ) ).toHaveCount( 1 );
		await expect( page.locator( '#jb-subpage-mount' ) ).toHaveCount( 1 );

		// The mount is only useful once the webpack app has rendered Settings into it.
		await expect( page.locator( '#jb-settings-tab-mount .jb-modern-settings' ) ).toHaveCount( 1 );
		await expect( page.locator( '#jb-admin-settings' ) ).toHaveCount( 0 );
		expect( missingConfigErrors ).toEqual( [] );
	} );

	test( 'Show free sites a collapsed score history notice instead of the chart', async ( {
		boostUtils,
		jetpackBoostPage,
		page,
	} ) => {
		await boostUtils.unMockPremiumFeatures();
		await boostUtils.setDashboardModernization( true );
		await jetpackBoostPage.visit();
		const upsell = page.locator( '.jetpack-boost-overview__history-upsell' );
		await expect( upsell.getByRole( 'link', { name: 'Upgrade now', exact: true } ) ).toBeVisible();
		await expect(
			upsell.getByRole( 'button', { name: 'Show score history preview' } )
		).toHaveAttribute( 'aria-expanded', 'false' );
		await expect( page.locator( '.jetpack-boost-overview .visx-bar' ) ).toHaveCount( 0 );
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

	for ( const destination of [ '&p=%2F%3Ftab%3Dsettings', '#/', '#/?tab=settings' ] ) {
		test( `Land at Optimize your speed from ${ destination }`, async ( {
			boostUtils,
			jetpackBoostPage,
			page,
		} ) => {
			await boostUtils.setDashboardModernization( true );
			await jetpackBoostPage.visit();
			await page.goto( `${ page.url().split( '#' )[ 0 ] }${ destination }` );
			const section = page.getByRole( 'region', { name: 'Optimize your speed' } );
			await expect( section ).toBeVisible();
			for ( const name of [ 'Cornerstone pages', 'Page loading', 'Code optimization', 'Images' ] ) {
				await expect( section.getByRole( 'button', { name, exact: true } ) ).toBeVisible();
			}
			await expect(
				page.getByRole( 'button', { name: 'Run speed test', exact: true } )
			).toBeVisible();
			await expect.poll( () => topOf( section ) ).toBeGreaterThan( 0 );
			await expect.poll( () => topOf( section ) ).toBeLessThan( 300 );
			await expect( page.getByRole( 'tab' ) ).toHaveCount( 0 );
		} );
	}

	test( 'Keep modern assets off other admin pages', async ( { boostUtils, admin, page } ) => {
		await boostUtils.setDashboardModernization( true );
		await admin.visitAdminPage( 'index.php' );
		await expect(
			page.locator( '#jetpack-boost-dashboard-wp-admin-prerequisites-js-after' )
		).toHaveCount( 0 );
		await expect( page.locator( '.jetpack-boost-page' ) ).toHaveCount( 0 );
	} );
} );
