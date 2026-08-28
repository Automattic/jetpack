import { expect, test } from '@automattic/_jetpack-e2e-commons/fixtures/base-test';
import type { TestUtils } from '@automattic/_jetpack-e2e-commons/utils/index';

/**
 * Comma-separated rewind capabilities `e2e-backup-test-helper.php` answers
 * `/sites/{id}/rewind/capabilities` with. Nothing else fakes this endpoint:
 * `e2e-plan-helper.php`, which `setMockPlanData()` drives, intercepts
 * `/sites/{id}` and `/sites/{id}/wordads/status` and nothing else — and
 * `<Gates>` never reads the site's Jetpack plan anyway.
 */
const CAPABILITIES_OPTION = 'e2e_backup_capabilities';

/**
 * How many capabilities requests the helper has answered. Asserted on so a
 * green run can't come from the helper silently doing nothing: the e2e site
 * is partner-provisioned on the free plan, so WordPress.com's own answer is
 * also "no Backup" and the no-plan gate would look identical either way.
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

		// Every spec establishes the connection state it needs, so start from a
		// known one. The playwright project deliberately omits the shared
		// 'connection setup' dependency for the same reason.
		await testUtils.disconnect();
	} );

	test( 'a disconnected site gets the not-connected screen', async ( {
		page,
		admin,
		testUtils,
	} ) => {
		await testUtils.executeWpCommand( [ 'option', 'update', CAPABILITIES_OPTION, 'backup' ] );

		await admin.visitAdminPage( 'admin.php', 'page=jetpack-backup' );

		// `.jpb-dashboard-layout` is the modernized `<DashboardLayout>`'s own
		// class, passed through `<Page>` from @wordpress/admin-ui. The legacy
		// Backup admin page does not render it, so this is what separates
		// "the wp-build dashboard booted" from "the flag was off and we are
		// asserting against the old React app".
		await expect( page.locator( '.jpb-dashboard-layout' ) ).toBeVisible();

		await expect(
			page.getByRole( 'heading', { name: 'Connect Jetpack to get started' } )
		).toBeVisible();

		// The capability list above says this site *does* have Backup, so a
		// request that had gone out would have come back with a plan. Zero
		// means none went out: `<Gates>` passes `enabled: useCanQueryWpcom()`
		// to `useCapabilities` (`gates/index.tsx:41`), and that is false
		// without a user-level connection (`use-connection.ts:90-93`).
		//
		// It is the heading above, not this count, that pins the branch order.
		// Both hooks are called at the top of `<Gates>` (lines 37 and 41, above
		// the first `if` on 43), so no reordering can change whether the
		// request happens: move the plan check first and this is still 0 —
		// a disabled query reports `isLoading === false` — while
		// `NoBackupPlanScreen` renders and the heading assertion fails.
		expect( await getInterceptCount( testUtils ) ).toBe( 0 );
	} );

	test( 'a connected site without the backup capability gets the no-plan screen', async ( {
		page,
		admin,
		testUtils,
	} ) => {
		// A non-empty list that lacks `backup`, rather than an empty one: the
		// gate must key on the capability itself, not merely on "we got
		// nothing back".
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

		// What `<Gates>` renders when it passes is the Overview screen's body,
		// and that body has two shapes: the two-pane activity view, or the
		// first-run/no-restore-point takeover panel. Which one appears depends
		// on the activity log and `/jetpack/v4/backups`, and this helper fakes
		// neither — those go to the real WordPress.com. So the assertion is
		// "one of the two bodies rendered", which is exactly the gate decision
		// and nothing more. Pinning down which body appears needs the canned
		// activity data a later slice adds.
		await expect( page.locator( '.jpb-overview, .jpb-backup-status' ).first() ).toBeVisible();

		// And no gate fallback anywhere: not-connected, secondary-admin,
		// capabilities-error and no-plan all render inside `.jpb-gates__card`.
		await expect( page.locator( '.jpb-gates__card' ) ).toHaveCount( 0 );

		expect( await getInterceptCount( testUtils ) ).toBeGreaterThan( 0 );
	} );
} );
