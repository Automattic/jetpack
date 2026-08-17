import { test, expect } from '../fixtures';
import { createRandomComment } from '../utils';

test( 'a logged-out visitor can leave a comment', async ( { page, verbum } ) => {
	const comment = createRandomComment();

	await verbum.open( 'open_comments' );
	const anonymousBefore = await page.getByText( 'Anonymous' ).count();

	await expect( verbum.panel ).toContainText( 'Leave a comment. (log in optional)' );

	await verbum.write( comment );
	await verbum.submit( comment );

	await expect( page.getByText( 'Anonymous' ) ).toHaveCount( anonymousBefore + 1 );
} );
