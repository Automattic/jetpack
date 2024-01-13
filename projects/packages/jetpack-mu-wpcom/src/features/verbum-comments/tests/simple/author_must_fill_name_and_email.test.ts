import { test, expect } from '@playwright/test';
import { createRandomComment, createRandomEmail, createRandomName } from '../utils';
import sites from '../sites';

test( 'Simple: author_must_fill_name_and_email', async ( { page } ) => {
	const randomComment = createRandomComment();
	const randomEmail = createRandomEmail();
	const randomName = createRandomName();

	await page.goto( sites.simple.author_must_fill_name_and_email + '#respond' );

	// Reply button should be disabled before log in.
	await expect( page.locator( '#comment-submit' ) ).toBeDisabled();

	await page.getByPlaceholder( 'Write a Comment...' ).type( randomComment );
	await page.getByPlaceholder( 'Email (Address never made' ).fill( randomEmail );
	await page.getByPlaceholder( 'Name' ).fill( randomName );
	await page.getByRole( 'button', { name: 'Reply' } ).click();
	await expect( page.getByRole( 'heading', { name: 'Never miss a beat!' } ) ).toBeVisible();
	await expect( page.getByRole( 'textbox', { name: 'Enter your email address' } ) ).toHaveValue(
		randomEmail
	);

	await page.getByRole( 'button', { name: 'Close' } ).click();
	await page.waitForLoadState( 'domcontentloaded' );

	await expect( page.getByText( randomComment ) ).toBeVisible();
} );
