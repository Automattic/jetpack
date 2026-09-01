import { test } from '../fixtures';
import { createRandomComment } from '../utils';

test( 'a logged-in visitor can leave a comment', async ( { verbum } ) => {
	const comment = createRandomComment();

	await verbum.open( 'open_comments' );

	// Writing first is what opens the subscription tray the login buttons live in.
	await verbum.write( comment );
	// logIn() already asserts the panel shows the account.
	await verbum.logIn();

	await verbum.submit( comment );
} );
