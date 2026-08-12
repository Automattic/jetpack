import { test, expect } from '@playwright/test';

test( 'Confirm current machine is sandboxed', async ( { page } ) => {
	await page.goto( 'https://public-api.wordpress.com/?amisandboxed' );

	await expect( page.getByText( 'Yes, you are currently sandboxing this API.' ) ).toBeVisible();
} );
