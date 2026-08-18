import { test } from '../fixtures';
import { createRandomComment } from '../utils';

test( 'a logged-in visitor can leave a comment', async ( { verbum } ) => {
	const comment = createRandomComment();

	await verbum.open( 'open_comments' );
	// logIn() already asserts the panel shows the account.
	await verbum.logIn();

	await verbum.write( comment );
	await verbum.submit( comment );
} );
