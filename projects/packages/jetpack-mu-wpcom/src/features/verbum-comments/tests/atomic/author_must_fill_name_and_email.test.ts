import { test, expect } from '@playwright/test';
import sites from '../sites';
import { createRandomComment, createRandomEmail, createRandomName } from '../utils';

test( 'Atomic: author_must_fill_name_and_email', async ( { page } ) => {
	const randomComment = createRandomComment();
	const randomEmail = createRandomEmail();
	const randomName = createRandomName();

	await page.goto( sites.atomic.author_must_fill_name_and_email + '#respond' );

	await page
		.frameLocator( 'iframe[name="jetpack_remote_comment"]' )
		.getByPlaceholder( 'Write a Comment...' )
		.type( randomComment );
	await page
		.frameLocator( 'iframe[name="jetpack_remote_comment"]' )
		.getByPlaceholder( 'Email (Address never made' )
		.fill( randomEmail );
	await page
		.frameLocator( 'iframe[name="jetpack_remote_comment"]' )
		.getByPlaceholder( 'Name' )
		.fill( randomName );
	await page
		.frameLocator( 'iframe[name="jetpack_remote_comment"]' )
		.getByRole( 'button', { name: 'Comment' } )
		.click();
	await page.getByText( 'Continue reading' ).click();

	await page.waitForLoadState( 'domcontentloaded' );
	await expect( page.getByText( randomComment ) ).toBeVisible();
	await expect( page.getByText( randomName ) ).toBeVisible();
	await expect( page.getByText( randomEmail ) ).not.toBeVisible();
} );
