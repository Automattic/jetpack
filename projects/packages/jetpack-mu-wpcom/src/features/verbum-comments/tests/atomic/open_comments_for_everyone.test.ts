import { test, expect } from '@playwright/test';
import sites from '../sites';
import { createRandomComment } from '../utils';

test( 'Atomic: open_comments_for_everyone - Anonymous', async ( { page } ) => {
	const randomComment = createRandomComment();

	await page.goto( sites.atomic.open_comments_for_everyone + '#respond' );
	const existingAnonComments = await page.getByText( 'Anonymous' ).count();

	await page
		.frameLocator( 'iframe[name="jetpack_remote_comment"]' )
		.getByPlaceholder( 'Write a comment...' )
		.click();
	await page
		.frameLocator( 'iframe[name="jetpack_remote_comment"]' )
		.getByPlaceholder( 'Write a comment...' )
		.pressSequentially( randomComment );

	await expect(
		page
			.frameLocator( 'iframe[name="jetpack_remote_comment"]' )
			.getByText( 'Leave a comment. (log in optional)' )
	).toBeVisible();
	await page
		.frameLocator( 'iframe[name="jetpack_remote_comment"]' )
		.getByRole( 'button', { name: 'Comment' } )
		.click();
	await page.getByText( 'Continue reading' ).click();

	await page.waitForLoadState( 'domcontentloaded' );
	await expect( page.getByText( randomComment ) ).toBeVisible();
	await expect( page.getByText( 'Anonymous' ) ).toHaveCount( existingAnonComments + 1 );
} );
