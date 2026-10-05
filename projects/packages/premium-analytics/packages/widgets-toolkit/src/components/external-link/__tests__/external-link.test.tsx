/**
 * External dependencies
 */
import { render, screen } from '@testing-library/react';
/**
 * Internal dependencies
 */
import { ExternalLink } from '../external-link';

describe( 'ExternalLink', () => {
	it( 'opens in a new tab with the outbound marker and no rel', () => {
		render( <ExternalLink href="https://example.com/pricing/">Pricing</ExternalLink> );

		const link = screen.getByRole( 'link', { name: 'Pricing(opens in a new tab)' } );
		expect( link ).toHaveAttribute( 'href', 'https://example.com/pricing/' );
		expect( link ).toHaveAttribute( 'target', '_blank' );
		expect( link ).not.toHaveAttribute( 'rel' );
		expect( screen.getByRole( 'img', { name: '(opens in a new tab)' } ) ).toBeInTheDocument();
	} );

	it( 'passes the class and title to the anchor', () => {
		render(
			<ExternalLink href="https://example.com/" className="row" title="Example">
				Example
			</ExternalLink>
		);

		const link = screen.getByRole( 'link' );
		expect( link ).toHaveClass( 'row' );
		expect( link ).toHaveAttribute( 'title', 'Example' );
	} );
} );
