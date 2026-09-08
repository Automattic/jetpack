import { expect, test } from '@automattic/_jetpack-e2e-commons/fixtures/base-test';
import type { TestUtils } from '@automattic/_jetpack-e2e-commons/utils/index';

/** Comma-separated rewind capabilities the e2e helper answers `/rewind/capabilities` with. */
const CAPABILITIES_OPTION = 'e2e_backup_capabilities';

/**
 * How many capabilities requests the helper has answered. Asserted on because the e2e
 * site's real plan also lacks Backup, so a mock that stopped working would still pass.
 */
const INTERCEPT_COUNT_OPTION = 'e2e_backup_capabilities_intercepts';

/**
 * Read the helper's interception counter.
 *
 * @param testUtils - e2e-commons test utilities.
 * @return The number of capabilities requests answered locally.
 */
async function getInterceptCount( testUtils: TestUtils ): Promise< number > {
	const raw = await testUtils.executeWpCommand( [ 'option', 'get', INTERCEPT_COUNT_OPTION ] );
	return parseInt( raw.trim(), 10 );
}

test.describe( 'Jetpack Backup modernized dashboard gates', () => {
	test.beforeEach( async ( { testUtils } ) => {
		await testUtils.executeWpCommand( [ 'plugin', 'activate', 'jetpack-backup' ] );
		await testUtils.executeWpCommand( [ 'plugin', 'activate', 'e2e-backup-test-helper' ] );
		await testUtils.executeWpCommand( [ 'option', 'update', INTERCEPT_COUNT_OPTION, '0' ] );

		// Every spec establishes the connection state it needs, so start from a known one.
		await testUtils.disconnect();
	} );

	test( 'a disconnected site gets the not-connected screen', async ( {
		page,
		admin,
		testUtils,
	} ) => {
		await testUtils.executeWpCommand( [ 'option', 'update', CAPABILITIES_OPTION, 'backup' ] );

		await admin.visitAdminPage( 'admin.php', 'page=jetpack-backup' );

		// The modernized `<DashboardLayout>`'s own class. The legacy admin page renders no
		// such element, so this separates "the dashboard booted" from "the flag was off".
		await expect( page.locator( '.jpb-dashboard-layout' ) ).toBeVisible();

		await expect(
			page.getByRole( 'heading', { name: 'Connect Jetpack to get started' } )
		).toBeVisible();

		// The list above grants Backup, so zero means no request went out: `<Gates>` disables
		// the capabilities query without a user-level connection.
		expect( await getInterceptCount( testUtils ) ).toBe( 0 );
	} );

	test( 'a connected site without the backup capability gets the no-plan screen', async ( {
		page,
		admin,
		testUtils,
	} ) => {
		// Non-empty but without `backup`, so the gate has to key on the capability itself
		// rather than on an empty response.
		await testUtils.executeWpCommand( [ 'option', 'update', CAPABILITIES_OPTION, 'scan' ] );
		await testUtils.connect();

		await admin.visitAdminPage( 'admin.php', 'page=jetpack-backup' );

		await expect( page.locator( '.jpb-dashboard-layout' ) ).toBeVisible();
		await expect(
			page.getByRole( 'heading', { name: "This site doesn't have an active Backup plan" } )
		).toBeVisible();

		expect( await getInterceptCount( testUtils ) ).toBeGreaterThan( 0 );
	} );

	test( 'a connected site with the backup capability gets the dashboard', async ( {
		page,
		admin,
		testUtils,
	} ) => {
		await testUtils.executeWpCommand( [ 'option', 'update', CAPABILITIES_OPTION, 'backup,scan' ] );
		await testUtils.connect();

		await admin.visitAdminPage( 'admin.php', 'page=jetpack-backup' );

		await expect( page.locator( '.jpb-dashboard-layout' ) ).toBeVisible();

		// The Overview body has two shapes, and which one renders turns on activity data this
		// helper does not fake — so the union is exactly the gate decision and nothing more.
		await expect( page.locator( '.jpb-overview, .jpb-backup-status' ).first() ).toBeVisible();

		// And no gate fallback: every gate screen renders inside `.jpb-gates__card`.
		await expect( page.locator( '.jpb-gates__card' ) ).toHaveCount( 0 );

		expect( await getInterceptCount( testUtils ) ).toBeGreaterThan( 0 );
	} );
} );
