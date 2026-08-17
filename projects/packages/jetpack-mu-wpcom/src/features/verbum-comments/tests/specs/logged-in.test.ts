import { test, expect } from '../fixtures';
import { createRandomComment, testingUser } from '../utils';

test( 'a logged-in visitor can leave a comment', async ( { verbum } ) => {
	const comment = createRandomComment();

	await verbum.open( 'open_comments' );
	await verbum.logIn();

	await expect( verbum.panel ).toContainText( testingUser.username );

	await verbum.write( comment );
	await verbum.submit( comment );
} );
