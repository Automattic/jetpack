import { test, expect } from '../fixtures';
import { createRandomComment } from '../utils';

test( 'a visitor must log in first when the site requires registration', async ( {
	surface,
	verbum,
} ) => {
	test.skip(
		! surface.posts.require_login,
		`No require_login post is configured for the ${ surface.name } surface.`
	);

	const comment = createRandomComment();

	await verbum.open( 'require_login' );

	await expect( verbum.panel ).toContainText( 'Log in to leave a comment.' );
	await expect( verbum.submitButton ).toBeDisabled();

	await verbum.write( comment );
	await verbum.logIn();

	await verbum.submit( comment );
} );
