import { test, expect } from '@playwright/test';
import sites from '../sites';
import { createRandomComment } from '../utils';

test( 'Simple: open_comments_for_everyone - Anonymous', async ( { page } ) => {
	const randomComment = createRandomComment();

	await page.goto( sites.simple.open_comments_for_everyone + '#respond' );
	// Handle cookie consent
	try {
		await page
			.frameLocator( '#cmp-app-container iframe' )
			.getByRole( 'button', { name: 'I Agree!' } )
			.click();
	} catch {
		// It's ok if it wasn't there to be dismissed.
	}

	const existingAnonComments = await page.getByText( 'Anonymous' ).count();
	await page.goto( sites.simple.open_comments_for_everyone + '#respond' );
	await page.getByPlaceholder( 'Write a comment...' ).click();
	await page.getByPlaceholder( 'Write a comment...' ).pressSequentially( randomComment );
	await expect( page.getByRole( 'button', { name: 'Comment' } ) ).toBeVisible();
	await expect( page.locator( '.comment-form__verbum' ) ).toContainText(
		'Leave a comment. (log in optional)'
	);
	await page.getByRole( 'button', { name: 'Comment' } ).click();
	await page.getByText( 'Continue reading' ).click();

	await expect( page.getByText( randomComment ) ).toBeVisible();
	await expect( page.getByText( 'Anonymous' ) ).toHaveCount( existingAnonComments + 1 );
} );
