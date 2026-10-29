import { expect, test } from '@automattic/_jetpack-e2e-commons/fixtures/base-test';
import {
	DOWNLOAD_URL,
	getFakeRequests,
	resetFake,
	REWIND_ID,
	setCapabilities,
} from '../lib/wpcom-fake';

test.describe( 'Jetpack Backup download', () => {
	test.beforeEach( async ( { testUtils } ) => {
		await testUtils.executeWpCommand( [ 'plugin', 'activate', 'jetpack-backup' ] );
		await testUtils.executeWpCommand( [ 'plugin', 'activate', 'e2e-backup-test-helper' ] );
		await resetFake( testUtils );
		await setCapabilities( testUtils, 'backup' );
		await testUtils.disconnect();
		await testUtils.connect();
	} );

	test( 'a generated download ends in a link to the archive', async ( {
		page,
		admin,
		testUtils,
	} ) => {
		await admin.visitAdminPage( 'admin.php', `page=jetpack-backup&p=/download/${ REWIND_ID }` );

		await expect( page.getByRole( 'heading', { name: 'Download backup' } ) ).toBeVisible();
		await page.getByRole( 'button', { name: 'Generate download' } ).click();

		await expect( page.getByRole( 'link', { name: 'Download file' } ) ).toHaveAttribute(
			'href',
			DOWNLOAD_URL
		);

		const body = ( await getFakeRequests( testUtils ) )[ 'POST rewind/downloads' ]?.body;
		expect( body?.rewindId ).toBe( REWIND_ID );
		expect( body?.types ).toEqual( {
			themes: true,
			plugins: true,
			roots: true,
			contents: true,
			sqls: true,
			uploads: true,
		} );
	} );
} );
