/**
 * External dependencies
 */
import { render, screen } from '@testing-library/react';
/**
 * Internal dependencies
 */
import { VideoTitleLink } from '../video-title-link';
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

describe( 'VideoTitleLink', () => {
	it( 'routes a row with a video ID to the detail page, carrying the report window', () => {
		render(
			<VideoTitleLink
				id={ 105 }
				label="Launch teaser"
				link="https://example.com/launch-teaser/"
				search={ { from: '2026-03-01', to: '2026-03-10' } }
			/>
		);

		const link = screen.getByRole( 'link', { name: 'Launch teaser' } );
		const href = link.getAttribute( 'href' ) ?? '';
		const search = new URL( href, 'https://example.com' ).searchParams;

		expect( link ).toHaveAttribute( 'href', expect.stringContaining( '/video/105' ) );
		expect( search.get( 'from' ) ).toBe( '2026-03-01' );
		expect( search.get( 'to' ) ).toBe( '2026-03-10' );
	} );

	it( 'gives an internal link no outbound target and no external marker', () => {
		render( <VideoTitleLink id={ 105 } label="Launch teaser" /> );

		const link = screen.getByRole( 'link', { name: 'Launch teaser' } );
		expect( link ).not.toHaveAttribute( 'target' );
		expect( link ).not.toHaveAttribute( 'rel' );
		expect( screen.queryByRole( 'img', { name: '(opens in a new tab)' } ) ).not.toBeInTheDocument();
	} );

	it( 'falls back to the public URL with an external marker when there is no video ID', () => {
		render( <VideoTitleLink label="Old upload" link="https://example.com/old-upload/" /> );

		const link = screen.getByRole( 'link', { name: 'Old upload(opens in a new tab)' } );
		expect( link ).toHaveAttribute( 'href', 'https://example.com/old-upload/' );
		expect( link ).toHaveAttribute( 'target', '_blank' );
		expect( link ).toHaveAttribute( 'rel', 'noopener noreferrer' );
		expect( screen.getByRole( 'img', { name: '(opens in a new tab)' } ) ).toBeInTheDocument();
	} );

	it( 'renders plain text when there is no ID and the fallback URL has an unsupported scheme', () => {
		render( <VideoTitleLink label="Sketchy" link="javascript:alert(1)" /> );

		expect( screen.queryByRole( 'link' ) ).not.toBeInTheDocument();
		expect( screen.getByText( 'Sketchy' ) ).toBeInTheDocument();
	} );
} );
