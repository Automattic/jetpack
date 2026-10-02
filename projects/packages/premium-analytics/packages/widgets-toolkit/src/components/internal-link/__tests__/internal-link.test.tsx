/**
 * External dependencies
 */
import { render, screen } from '@testing-library/react';
/**
 * Internal dependencies
 */
import { InternalLink } from '../internal-link';
import type { AnchorHTMLAttributes, ReactNode } from 'react';

type MockRouteLinkProps = {
	to: string;
	params?: Record< string, unknown >;
	search?: Record< string, unknown >;
	children: ReactNode;
} & Omit< AnchorHTMLAttributes< HTMLAnchorElement >, 'href' >;

// `forwardRef`, because the design system link that renders this forwards a ref.
jest.mock( '@wordpress/route', () => {
	const { forwardRef } = jest.requireActual( 'react' ) as typeof import( 'react' );

	return {
		Link: forwardRef< HTMLAnchorElement, MockRouteLinkProps >(
			( { to, params, search, children, ...props }, ref ) => {
				const path = Object.entries( params ?? {} ).reduce(
					( result, [ key, value ] ) => result.replace( `$${ key }`, String( value ) ),
					to
				);
				const query = new URLSearchParams();
				Object.entries( search ?? {} ).forEach( ( [ key, value ] ) => {
					if ( value !== undefined && value !== null ) {
						query.set( key, String( value ) );
					}
				} );
				const queryString = query.toString();

				return (
					<a ref={ ref } href={ queryString ? `${ path }?${ queryString }` : path } { ...props }>
						{ children }
					</a>
				);
			}
		),
	};
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
