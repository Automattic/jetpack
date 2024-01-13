import { test, expect } from '@playwright/test';
import { createRandomComment } from '../utils';
import sites from '../sites';

test( 'Atomic: open_comments_for_everyone - Anonymous', async ( { page } ) => {
	const randomComment = createRandomComment();

	await page.goto( sites.atomic.open_comments_for_everyone + '#respond' );
	const existingAnonComments = await page.getByText( 'Anonymous' ).count();

	await page
		.frameLocator( 'iframe[name="jetpack_remote_comment"]' )
		.getByPlaceholder( 'Write a Comment...' )
		.click();
	await page
		.frameLocator( 'iframe[name="jetpack_remote_comment"]' )
		.getByPlaceholder( 'Write a Comment...' )
		.fill( randomComment );

	await expect(
		page
			.frameLocator( 'iframe[name="jetpack_remote_comment"]' )
			.getByText( 'Leave a reply. (log in optional)' )
	).toBeVisible();
	await page
		.frameLocator( 'iframe[name="jetpack_remote_comment"]' )
		.getByRole( 'button', { name: 'Reply' } )
		.click();
	await page.waitForLoadState( 'domcontentloaded' );
	await expect( page.getByText( randomComment ) ).toBeVisible();
	await expect( page.getByText( 'Anonymous' ) ).toHaveCount( existingAnonComments + 1 );
} );
