/**
 * External dependencies
 */
import { render, screen } from '@testing-library/react';
/**
 * Internal dependencies
 */
import { ViewLiveLink } from '../view-live-link';

describe( 'ViewLiveLink', () => {
	it( 'opens the public URL in a new tab, named after the content', () => {
		render( <ViewLiveLink href="https://example.com/hello-world/" label="Hello world" /> );

		const link = screen.getByRole( 'link', { name: 'View "Hello world" in a new tab' } );
		expect( link ).toHaveAttribute( 'href', 'https://example.com/hello-world/' );
		expect( link ).toHaveAttribute( 'target', '_blank' );
	} );
} );
