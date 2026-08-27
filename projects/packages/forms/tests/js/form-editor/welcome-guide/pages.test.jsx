/**
 * Tests for the welcome guide slides
 *
 * The slides are built by zipping copy against `WELCOME_GUIDE_IMAGES` by index,
 * so a slide added without its artwork would render `src={ undefined }` with
 * nothing else failing. These pin the pairing.
 */

import { render, screen } from '@testing-library/react';
import {
	getWelcomeGuidePages,
	WELCOME_GUIDE_IMAGES,
} from '../../../../src/form-editor/welcome-guide/pages';

describe( 'welcome-guide/pages', () => {
	test( 'builds one page per artwork', () => {
		expect( getWelcomeGuidePages() ).toHaveLength( WELCOME_GUIDE_IMAGES.length );
	} );

	test( 'uses a distinct image for each slide', () => {
		expect( new Set( WELCOME_GUIDE_IMAGES ).size ).toBe( WELCOME_GUIDE_IMAGES.length );
	} );

	/*
	 * Both halves of each slide are asserted together, against the artwork's own
	 * filename. Checking the image against `WELCOME_GUIDE_IMAGES[ index ]` — the
	 * list the slides are built from — would hold however either list was
	 * reordered, and so catch nothing.
	 */
	test.each( [
		[ 0, 'Welcome to the form editor', 'welcome.webp' ],
		[ 1, 'Add fields', 'add-fields.webp' ],
		[ 2, 'Make each field yours', 'field-settings.webp' ],
		[ 3, 'Decide what happens after submit', 'after-submit.webp' ],
		[ 4, 'Publish and share it', 'publish.webp' ],
	] )( 'slide %i pairs "%s" with %s', ( index, heading, filename ) => {
		const page = getWelcomeGuidePages()[ index ];

		render(
			<>
				{ page.image }
				{ page.content }
			</>
		);

		expect( screen.getByRole( 'heading' ) ).toHaveTextContent( heading );

		// An empty alt keeps the artwork out of the accessibility tree, so it
		// resolves as presentational rather than as an image.
		expect( screen.queryByRole( 'img' ) ).not.toBeInTheDocument();
		expect( screen.getByRole( 'presentation' ) ).toHaveAttribute( 'src', filename );
	} );
} );
