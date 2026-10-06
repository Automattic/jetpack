/**
 * External dependencies
 */
import { render, screen } from '@testing-library/react';
/**
 * Internal dependencies
 */
import { InternalLink } from '../internal-link';

jest.mock( '@wordpress/route', () => {
	const { mockWordPressRoute } = jest.requireActual(
		'../../../../../../tests/js/route-test-utils'
	);

	return mockWordPressRoute;
} );

describe( 'InternalLink', () => {
	it( 'routes to the path with its params and search', () => {
		render(
			<InternalLink
				to="/post/$postId"
				params={ { postId: '41' } }
				search={ { from: '2026-03-01' } }
			>
				Hello world
			</InternalLink>
		);

		expect( screen.getByRole( 'link', { name: 'Hello world' } ) ).toHaveAttribute(
			'href',
			'/post/41?from=2026-03-01'
		);
	} );

	it( 'carries no outbound target, rel or marker', () => {
		render( <InternalLink to="/reports/posts">Posts</InternalLink> );

		const link = screen.getByRole( 'link', { name: 'Posts' } );
		expect( link ).not.toHaveAttribute( 'target' );
		expect( link ).not.toHaveAttribute( 'rel' );
		expect( screen.queryByRole( 'img', { name: '(opens in a new tab)' } ) ).not.toBeInTheDocument();
	} );

	it( 'passes the class, title and accessible label to the anchor', () => {
		render(
			<InternalLink to="/reports/posts" className="row" title="Posts" ariaLabel="View all posts">
				View all
			</InternalLink>
		);

		const link = screen.getByRole( 'link', { name: 'View all posts' } );
		expect( link ).toHaveClass( 'row' );
		expect( link ).toHaveAttribute( 'title', 'Posts' );
	} );
} );
