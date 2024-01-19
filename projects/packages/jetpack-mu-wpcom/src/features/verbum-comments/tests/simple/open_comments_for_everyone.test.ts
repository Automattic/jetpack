import { test, expect } from '@playwright/test';
import sites from '../sites';
import { createRandomComment } from '../utils';

test( 'Simple: open_comments_for_everyone - Anonymous', async ( { page } ) => {
	const randomComment = createRandomComment();

	await page.goto( sites.simple.open_comments_for_everyone + '#respond' );
	const existingAnonComments = await page.getByText( 'Anonymous' ).count();
	await page.goto( sites.simple.open_comments_for_everyone + '#respond' );
	await page.getByPlaceholder( 'Write a Comment...' ).click();
	await page.getByPlaceholder( 'Write a Comment...' ).type( randomComment );
	await expect( page.getByRole( 'button', { name: 'Reply' } ) ).toBeVisible();
	await expect( page.locator( '#comment-form__verbum' ) ).toContainText(
		'Leave a reply. (log in optional)'
	);
	await page.getByRole( 'button', { name: 'Reply' } ).click();
	await expect( page.locator( '#comment-form__verbum' ) ).toContainText( 'Never miss a beat!' );
	await page.getByRole( 'button', { name: 'Close' } ).click();
	await expect( page.getByText( randomComment ) ).toBeVisible();
	await expect( page.getByText( 'Anonymous' ) ).toHaveCount( existingAnonComments + 1 );
} );
