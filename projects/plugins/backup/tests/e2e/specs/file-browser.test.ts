import { expect, test } from '@automattic/_jetpack-e2e-commons/fixtures/base-test';
import {
	FILE_CONTENT,
	FILE_URL,
	getFakeRequests,
	resetFake,
	setCapabilities,
} from '../lib/wpcom-fake';

test.describe( 'Jetpack Backup file browser', () => {
	test.beforeEach( async ( { testUtils } ) => {
		await testUtils.executeWpCommand( [ 'plugin', 'activate', 'jetpack-backup' ] );
		await testUtils.executeWpCommand( [ 'plugin', 'activate', 'e2e-backup-test-helper' ] );
		await resetFake( testUtils );
		await setCapabilities( testUtils, 'backup' );
		await testUtils.disconnect();
		await testUtils.connect();
	} );

	test( 'a file in the backup can be previewed and downloaded', async ( {
		page,
		admin,
		testUtils,
	} ) => {
		await admin.visitAdminPage( 'admin.php', 'page=jetpack-backup' );

		await page.getByRole( 'button', { name: 'Folder: wp-content' } ).click();
		await page.getByRole( 'button', { name: 'File: notes.txt' } ).click();

		await expect( page.getByRole( 'region', { name: 'Preview of notes.txt' } ) ).toContainText(
			FILE_CONTENT
		);

		// The browser follows the signed URL itself, so catch it there instead of letting it leave.
		await page.route( FILE_URL, route => route.abort() );
		const fileRequest = page.waitForRequest( FILE_URL );
		await page.getByRole( 'button', { name: 'Download file' } ).click();
		await fileRequest;

		expect( ( await getFakeRequests( testUtils ) )[ 'POST rewind/backup/ls' ]?.body ).toEqual( {
			backup_id: '1760000000',
			path: '/wp-content',
		} );
	} );
} );
