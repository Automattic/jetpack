/**
 * External dependencies
 */
import { render, screen } from '@testing-library/react';
/**
 * Internal dependencies
 */
import { PostTitleLink } from '../post-title-link';
import type { AnchorHTMLAttributes, ReactNode } from 'react';

type MockRouteLinkProps = {
	to: string;
	params?: Record< string, unknown >;
	search?: Record< string, unknown >;
	children: ReactNode;
} & Omit< AnchorHTMLAttributes< HTMLAnchorElement >, 'href' >;

// `forwardRef`, because the design system link that renders this forwards a ref.
jest.mock( '@wordpress/route', () => {
	const { forwardRef } = jest.requireActual( 'react' ) as typeof import('react');

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

describe( 'PostTitleLink', () => {
	it( 'routes a row with a post ID to the detail page, carrying the report window', () => {
		render(
			<PostTitleLink
				id={ 41 }
				label="Hello world"
				link="https://example.com/hello-world/"
				search={ { from: '2026-03-01', to: '2026-03-10' } }
			/>
		);

		const link = screen.getByRole( 'link', { name: 'Hello world' } );
		const href = link.getAttribute( 'href' ) ?? '';
		const search = new URL( href, 'https://example.com' ).searchParams;

		expect( link ).toHaveAttribute( 'href', expect.stringContaining( '/post/41' ) );
		expect( search.get( 'from' ) ).toBe( '2026-03-01' );
		expect( search.get( 'to' ) ).toBe( '2026-03-10' );
		expect( search.get( 'post_url' ) ).toBe( 'https://example.com/hello-world/' );
	} );

	it( 'gives an internal link no outbound target and no external marker', () => {
		render( <PostTitleLink id={ 41 } label="Hello world" /> );

		const link = screen.getByRole( 'link', { name: 'Hello world' } );
		expect( link ).not.toHaveAttribute( 'target' );
		expect( link ).not.toHaveAttribute( 'rel' );
		expect( screen.queryByRole( 'img', { name: '(opens in a new tab)' } ) ).not.toBeInTheDocument();
	} );

	it( 'falls back to the public URL with an external marker when there is no post ID', () => {
		render( <PostTitleLink label="Pricing" link="https://example.com/?s=pricing" /> );

		const link = screen.getByRole( 'link', { name: 'Pricing(opens in a new tab)' } );
		expect( link ).toHaveAttribute( 'href', 'https://example.com/?s=pricing' );
		expect( link ).toHaveAttribute( 'target', '_blank' );
		expect( link ).toHaveAttribute( 'rel', 'noopener noreferrer' );
		expect( screen.getByRole( 'img', { name: '(opens in a new tab)' } ) ).toBeInTheDocument();
	} );

	it( 'treats the homepage entry (id 0) as having no detail page', () => {
		render( <PostTitleLink id={ 0 } label="Homepage (Latest posts)" /> );

		expect( screen.queryByRole( 'link' ) ).not.toBeInTheDocument();
		expect( screen.getByText( 'Homepage (Latest posts)' ) ).toBeInTheDocument();
	} );

	it( 'renders plain text when the fallback URL has an unsupported scheme', () => {
		render( <PostTitleLink label="Sketchy" link="javascript:alert(1)" /> );

		expect( screen.queryByRole( 'link' ) ).not.toBeInTheDocument();
		expect( screen.getByText( 'Sketchy' ) ).toBeInTheDocument();
	} );
} );
