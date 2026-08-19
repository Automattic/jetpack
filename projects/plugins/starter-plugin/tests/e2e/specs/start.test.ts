import { expect, test } from '@automattic/_jetpack-e2e-commons/fixtures/base-test';

test.describe( 'Starter Plugin!', () => {
	test( 'Visit Jetpack page', async ( { page, admin } ) => {
		await test.step( 'Visit dashboard page', async () => {
			await admin.visitAdminPage( '' );
			await expect(
				page.getByRole( 'heading', { name: 'Dashboard' } ),
				'Dashboard heading should be visible'
			).toBeVisible();
		} );

		await test.step( 'Navigate to Jetpack page', async () => {
			await page.getByRole( 'link', { name: 'Jetpack', exact: true } ).click();
			await expect(
				page.getByRole( 'img', { name: 'Jetpack Logo' } ),
				'Jetpack logo should be visible'
			).toBeVisible();
		} );
	} );
} );
