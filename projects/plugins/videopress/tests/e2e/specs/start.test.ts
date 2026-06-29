import { expect, test } from '@automattic/_jetpack-e2e-commons/fixtures/base-test';

test.describe( 'VideoPress plugin!', () => {
	test( 'Visit Jetpack page', async ( { page, admin } ) => {
		await test.step( 'Visit Jetpack Videopress page', async () => {
			await admin.visitAdminPage( 'admin.php', 'page=jetpack-videopress' );
			expect( page.url() ).toContain( 'page=jetpack-videopress' );
		} );
	} );
} );
