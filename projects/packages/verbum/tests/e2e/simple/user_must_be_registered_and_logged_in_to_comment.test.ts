import { test, expect } from '@playwright/test';
import sites from '../sites';
import { createRandomComment, testingUser } from '../utils';

test( 'Simple: user_must_be_registered_and_logged_in_to_comment - Anonymous', async ( {
	page,
} ) => {
	const randomComment = createRandomComment();

	await page.goto( sites.simple.user_must_be_registered_and_logged_in_to_comment + '#respond' );
	// Handle cookie consent
	try {
		await page
			.frameLocator( '#cmp-app-container iframe' )
			.getByRole( 'button', { name: 'I Agree!' } )
			.click();
	} catch {
		// It's ok if it wasn't there to be dismissed.
	}

	await page.getByText( 'Leave a comment', { exact: true } ).click();

	await page
		.frameLocator( 'iframe[name="editor-canvas"]' )
		.locator( 'p[contenteditable="true"]' )
		.pressSequentially( randomComment );

	await expect( page.locator( '.comment-form__verbum' ) ).toContainText(
		'Log in to leave a comment.'
	);
	// Reply button should be disabled before log in.
	await expect( page.locator( '#comment-submit' ) ).toBeDisabled();

	// <!---- start login ----->
	const loginPopup = page.waitForEvent( 'popup' );
	await page.locator( 'button.social-button.wordpress' ).first().click();
	const loginPopupPage = await loginPopup;
	await loginPopupPage.getByLabel( 'Email Address or Username' ).fill( testingUser.username );
	await loginPopupPage.getByRole( 'button', { name: 'Continue', exact: true } ).click();
	await loginPopupPage.getByLabel( 'Password' ).fill( testingUser.password );
	await loginPopupPage.getByRole( 'button', { name: 'Log In' } ).click();
	// <!---- end login ----->

	await expect( page.locator( '.comment-form__verbum' ) ).toContainText(
		`${ testingUser.username } - Logged in via WordPress.com`
	);
	await page.getByRole( 'button', { name: 'Comment' } ).click();
	await page.waitForLoadState( 'domcontentloaded' );

	await page.waitForLoadState( 'domcontentloaded' );

	await expect( page.getByText( randomComment ) ).toBeVisible();
} );
