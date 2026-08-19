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
	await verbum.write( comment );

	// Assert after writing: an empty comment disables the button on its own, so checking
	// earlier would pass on a site that asks for neither field. With the comment in place,
	// only the missing name and email hold it.
	await expect( verbum.submitButton ).toBeDisabled();

	await verbum.emailField.fill( email );
	await verbum.nameField.fill( name );

	// submit() asserts the button is enabled first, so this fails loudly if supplying the
	// fields did not release the gate.
	await verbum.submit( comment );

	await expect( page.getByText( name ) ).toBeVisible();
	await expect( page.getByText( email ) ).toBeHidden();
} );
