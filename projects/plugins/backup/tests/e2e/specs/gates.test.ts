import { expect, test } from '@automattic/_jetpack-e2e-commons/fixtures/base-test';
import { failCapabilities, getFakeRequests, resetFake, setCapabilities } from '../lib/wpcom-fake';
import type { TestUtils } from '@automattic/_jetpack-e2e-commons/utils/index';
import type { Page } from '@playwright/test';

const SECONDARY_ADMIN = 'e2e-backup-secondary-admin';

/**
 * How many capabilities requests the helper has answered, once the page goes quiet.
 *
 * Waiting matters for the zero assertions: a request still in flight is not counted yet.
 *
 * @param page      - The page that would have made the requests.
 * @param testUtils - e2e-commons test utilities.
 * @return The number of capabilities requests answered locally.
 */
async function getInterceptCount( page: Page, testUtils: TestUtils ): Promise< number > {
	// eslint-disable-next-line playwright/no-networkidle -- settling, not readiness, is the point here.
	await page.waitForLoadState( 'networkidle' );
	return ( await getFakeRequests( testUtils ) )[ 'GET rewind/capabilities' ]?.count ?? 0;
}

test.describe( 'Jetpack Backup modernized dashboard gates', () => {
	test.beforeEach( async ( { testUtils } ) => {
		await testUtils.executeWpCommand( [ 'plugin', 'activate', 'jetpack-backup' ] );
		await testUtils.executeWpCommand( [ 'plugin', 'activate', 'e2e-backup-test-helper' ] );
		await resetFake( testUtils );

		// Every spec establishes the connection state it needs, so start from a known one.
		await testUtils.disconnect();
	} );

	test( 'a disconnected site gets the not-connected screen', async ( {
		page,
		admin,
		testUtils,
	} ) => {
		await setCapabilities( testUtils, 'backup' );

		await admin.visitAdminPage( 'admin.php', 'page=jetpack-backup' );

		// The modernized `<DashboardLayout>`'s own class. The legacy admin page renders no
		// such element, so this separates "the dashboard booted" from "the flag was off".
		await expect( page.locator( '.jpb-dashboard-layout' ) ).toBeVisible();

		await expect(
			page.getByRole( 'heading', { name: 'Connect Jetpack to get started' } )
		).toBeVisible();

		// The list above grants Backup, so zero means no request went out: `<Gates>` disables
		// the capabilities query without a user-level connection.
		expect( await getInterceptCount( page, testUtils ) ).toBe( 0 );
	} );

	test( 'an admin without a linked account gets the secondary-admin screen', async ( {
		browser,
		baseURL,
		testUtils,
	} ) => {
		await setCapabilities( testUtils, 'backup' );
		await testUtils.connect();

		const password = `${ SECONDARY_ADMIN }-password`;
		await testUtils.executeWpCommand( [
			'user',
			'create',
			SECONDARY_ADMIN,
			`${ SECONDARY_ADMIN }@example.com`,
			'--role=administrator',
			`--user_pass=${ password }`,
		] );

		const context = await browser.newContext( { baseURL } );

		try {
			await context.request.post( 'wp-login.php', {
				form: { log: SECONDARY_ADMIN, pwd: password },
			} );
			const page = await context.newPage();
			await page.goto( 'wp-admin/admin.php?page=jetpack-backup' );

			await expect( page.locator( '.jpb-dashboard-layout' ) ).toBeVisible();
			await expect(
				page.getByRole( 'heading', { name: 'Link your WordPress.com account' } )
			).toBeVisible();

			// The gate decides on the connection state alone, before any request is made.
			expect( await getInterceptCount( page, testUtils ) ).toBe( 0 );
		} finally {
			await context.close();
			await testUtils.executeWpCommand( [ 'user', 'delete', SECONDARY_ADMIN, '--yes' ] );
		}
	} );

	test( 'a connected site without the backup capability gets the no-plan screen', async ( {
		page,
		admin,
		testUtils,
	} ) => {
		// Non-empty but without `backup`, so the gate has to key on the capability itself
		// rather than on an empty response.
		await setCapabilities( testUtils, 'scan' );
		await testUtils.connect();

		await admin.visitAdminPage( 'admin.php', 'page=jetpack-backup' );

		await expect( page.locator( '.jpb-dashboard-layout' ) ).toBeVisible();
		await expect(
			page.getByRole( 'heading', { name: 'Add a Jetpack Backup plan' } )
		).toBeVisible();

		expect( await getInterceptCount( page, testUtils ) ).toBeGreaterThan( 0 );
	} );

	test( 'a failed capabilities request gets the error screen', async ( {
		page,
		admin,
		testUtils,
	} ) => {
		await setCapabilities( testUtils, 'backup' );
		await failCapabilities( testUtils );
		await testUtils.connect();

		await admin.visitAdminPage( 'admin.php', 'page=jetpack-backup' );

		await expect(
			page.getByRole( 'heading', { name: "We couldn't load your backup details" } )
		).toBeVisible();
		await expect( page.getByRole( 'button', { name: 'Try again' } ) ).toBeVisible();

		expect( await getInterceptCount( page, testUtils ) ).toBeGreaterThan( 0 );
	} );

	test( 'a connected site with the backup capability gets the dashboard', async ( {
		page,
		admin,
		testUtils,
	} ) => {
		await setCapabilities( testUtils, 'backup,scan' );
		await testUtils.connect();

		await admin.visitAdminPage( 'admin.php', 'page=jetpack-backup' );

		await expect( page.locator( '.jpb-dashboard-layout' ) ).toBeVisible();
		await expect( page.locator( '.jpb-overview' ) ).toBeVisible();

		// And no gate fallback: every gate screen renders inside `.jpb-gates__card`.
		await expect( page.locator( '.jpb-gates__card' ) ).toHaveCount( 0 );

		expect( await getInterceptCount( page, testUtils ) ).toBeGreaterThan( 0 );
	} );
} );
