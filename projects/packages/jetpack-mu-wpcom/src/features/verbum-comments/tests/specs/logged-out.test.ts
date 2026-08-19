import { test, expect } from '../fixtures';
import { createRandomComment } from '../utils';

test( 'a logged-out visitor can leave a comment', async ( { page, verbum } ) => {
	const comment = createRandomComment();

	await verbum.open( 'open_comments' );

	await expect( verbum.panel ).toContainText( 'Leave a comment. (log in optional)' );

	await verbum.write( comment );
	await verbum.submit( comment );

	// Read the attribution off the new comment rather than counting 'Anonymous' across the
	// page: these posts hold enough comments to paginate, and submitting lands on whichever
	// page the new comment fell on, so a count taken beforehand counts a different page.
	await expect( page.locator( 'li.comment' ).filter( { hasText: comment } ) ).toContainText(
		'Anonymous'
	);
} );
