import { expect, test } from '@automattic/_jetpack-e2e-commons/fixtures/base-test';
import { getFakeRequests, resetFake, REWIND_ID, setCapabilities } from '../lib/wpcom-fake';

test.describe( 'Jetpack Backup restore', () => {
	test.beforeEach( async ( { testUtils } ) => {
		await testUtils.executeWpCommand( [ 'plugin', 'activate', 'jetpack-backup' ] );
		await testUtils.executeWpCommand( [ 'plugin', 'activate', 'e2e-backup-test-helper' ] );
		await resetFake( testUtils );
		await setCapabilities( testUtils, 'backup' );
		await testUtils.disconnect();
		await testUtils.connect();
	} );

	test( 'a restore of the selected items runs to completion', async ( {
		page,
		admin,
		testUtils,
	} ) => {
		await admin.visitAdminPage( 'admin.php', `page=jetpack-backup&p=/restore/${ REWIND_ID }` );

		await expect( page.getByRole( 'heading', { name: 'Restore backup' } ) ).toBeVisible();
		await page.getByRole( 'checkbox', { name: /Media uploads/ } ).uncheck();
		await page.getByRole( 'button', { name: 'Confirm restore' } ).click();

		// The fake reports queued, then running, then finished, one poll apart.
		await expect( page.locator( '.jpb-restore__status' ) ).toContainText( 'Restore complete.', {
			timeout: 30_000,
		} );

		const body = ( await getFakeRequests( testUtils ) )[ 'POST rewind/restores' ]?.body;
		expect( body?.rewindId ).toBe( REWIND_ID );
		expect( body?.types ).toEqual( {
			themes: true,
			plugins: true,
			roots: true,
			contents: true,
			sqls: true,
		} );
	} );
} );
