import { test, expect } from '@playwright/test';
import sites from '../sites';
import { createRandomComment, createRandomEmail, createRandomName } from '../utils';

test( 'Simple: author_must_fill_name_and_email', async ( { page } ) => {
	const randomComment = createRandomComment();
	const randomEmail = createRandomEmail();
	const randomName = createRandomName();

	await page.goto( sites.simple.author_must_fill_name_and_email + '#respond' );

	// Handle cookie consent
	try {
		await page
			.frameLocator( '#cmp-app-container iframe' )
			.getByRole( 'button', { name: 'I Agree!' } )
			.click();
	} catch {
		// It's ok if it wasn't there to be dismissed.
	}

	// Reply button should be disabled before log in.
	await expect( page.locator( '#comment-submit' ) ).toBeDisabled();

	await page.getByPlaceholder( 'Write a comment...' ).type( randomComment );
	await page.getByPlaceholder( 'Email (Address never made' ).fill( randomEmail );
	await page.getByPlaceholder( 'Name' ).fill( randomName );
	await page.getByRole( 'button', { name: 'Comment' } ).click();
	await page.getByText( 'Continue reading' ).click();

	await page.waitForLoadState( 'domcontentloaded' );

	await expect( page.getByText( randomComment ) ).toBeVisible();
} );
