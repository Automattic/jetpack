import { test, expect } from '@playwright/test';
import { createRandomComment, testingUser } from '../utils';
import sites from '../sites';

test( 'Simple: user_must_be_registered_and_logged_in_to_comment - Anonymous', async ( {
	page,
} ) => {
	const randomComment = createRandomComment();

	await page.goto( sites.simple.user_must_be_registered_and_logged_in_to_comment + '#respond' );
	await page.getByPlaceholder( 'Write a Comment...' ).click();
	await page.getByPlaceholder( 'Write a Comment...' ).type( randomComment );
	await expect( page.locator( '#comment-form__verbum' ) ).toContainText(
		'Log in to leave a reply.'
	);
	// Reply button should be disabled before log in.
	await expect( page.locator( '#comment-submit' ) ).toBeDisabled();

	// <!---- start login ----->
	const loginPopup = page.waitForEvent( 'popup' );
	await page.getByRole( 'button' ).first().click();
	const loginPopupPage = await loginPopup;
	await loginPopupPage.getByLabel( 'Email Address or Username' ).fill( testingUser.username );
	await loginPopupPage.getByRole( 'button', { name: 'Continue', exact: true } ).click();
	await loginPopupPage.getByLabel( 'Password' ).fill( testingUser.password );
	await loginPopupPage.getByRole( 'button', { name: 'Log In' } ).click();
	// <!---- end login ----->

	await expect( page.locator( '#comment-form__verbum' ) ).toContainText(
		`${ testingUser.username } - Logged in via WordPress.com`
	);
	await page.getByRole( 'button', { name: 'Reply' } ).click();
	await page.waitForLoadState( 'domcontentloaded' );

	await expect( page.locator( '#comment-form__verbum' ) ).toContainText( 'Never miss a beat!' );
	await page.getByRole( 'button', { name: 'Close' } ).nth( 2 ).click();
	await page.waitForLoadState( 'domcontentloaded' );

	await expect( page.getByText( randomComment ) ).toBeVisible();
} );
