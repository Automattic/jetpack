import { test, expect } from '../fixtures';
import { createRandomComment, createRandomEmail, createRandomName } from '../utils';

test( 'a visitor can comment by supplying a name and email', async ( {
	page,
	surface,
	verbum,
} ) => {
	test.skip(
		! surface.posts.require_name_email,
		`No require_name_email post is configured for the ${ surface.name } surface.`
	);

	const comment = createRandomComment();
	const email = createRandomEmail();
	const name = createRandomName();

	await verbum.open( 'require_name_email' );

	await expect( verbum.panel ).toContainText(
		'Log in or provide your name and email to leave a comment.'
	);
	// Nothing can be submitted until the required fields are filled in.
	await expect( verbum.submitButton ).toBeDisabled();

	await verbum.write( comment );
	await verbum.emailField.fill( email );
	await verbum.nameField.fill( name );

	await verbum.submit( comment );

	await expect( page.getByText( name ) ).toBeVisible();
	await expect( page.getByText( email ) ).toBeHidden();
} );
