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

jest.mock( '@wordpress/route', () => ( {
	Link: ( { to, params, search, children, ...props }: MockRouteLinkProps ) => {
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
			<a href={ queryString ? `${ path }?${ queryString }` : path } { ...props }>
				{ children }
			</a>
		);
	},
} ) );

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
	} );

	it( 'gives an internal link no outbound target and no external icon', () => {
		const { container } = render( <PostTitleLink id={ 41 } label="Hello world" /> );

		const link = screen.getByRole( 'link', { name: 'Hello world' } );
		expect( link ).not.toHaveAttribute( 'target' );
		expect( link ).not.toHaveAttribute( 'rel' );
		// The icon marks a destination outside the app; an internal route is not one.
		// eslint-disable-next-line testing-library/no-container, testing-library/no-node-access -- the icon renders as an unlabelled SVG.
		expect( container.querySelector( 'svg' ) ).toBeNull();
	} );

	it( 'falls back to the public URL with an external icon when there is no post ID', () => {
		const { container } = render(
			<PostTitleLink label="Pricing" link="https://example.com/?s=pricing" />
		);

		const link = screen.getByRole( 'link', { name: 'Open Pricing in a new tab' } );
		expect( link ).toHaveAttribute( 'href', 'https://example.com/?s=pricing' );
		expect( link ).toHaveAttribute( 'target', '_blank' );
		expect( link ).toHaveAttribute( 'rel', 'noopener noreferrer' );
		// eslint-disable-next-line testing-library/no-container, testing-library/no-node-access -- the icon renders as an unlabelled SVG.
		expect( container.querySelector( 'svg' ) ).not.toBeNull();
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
