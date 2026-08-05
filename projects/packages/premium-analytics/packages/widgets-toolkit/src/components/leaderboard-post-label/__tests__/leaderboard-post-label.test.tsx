/**
 * External dependencies
 */
import { render, screen } from '@testing-library/react';
/**
 * Internal dependencies
 */
import { useWidgetRootContext } from '../../widget-root';
import { LeaderboardPostLabel } from '../leaderboard-post-label';
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

jest.mock( '../../widget-root', () => ( {
	useWidgetRootContext: jest.fn(),
} ) );

const mockUseWidgetRootContext = useWidgetRootContext as jest.Mock;

beforeEach( () => {
	mockUseWidgetRootContext.mockReturnValue( { reportParams: { from: '2026-06-01' } } );
} );

describe( 'LeaderboardPostLabel', () => {
	it( 'links a post to its detail route and carries the report window', () => {
		render(
			<LeaderboardPostLabel id={ 12 } label="Hello world" link="https://example.com/hello/" />
		);

		const link = screen.getByRole( 'link', { name: 'Hello world' } );
		const url = new URL( link.getAttribute( 'href' ) ?? '', 'https://example.com' );

		expect( url.pathname ).toBe( '/post/12' );
		expect( url.searchParams.get( 'from' ) ).toBe( '2026-06-01' );
		expect( url.searchParams.get( 'post_url' ) ).toBe( 'https://example.com/hello/' );
		expect( link ).not.toHaveAttribute( 'target', '_blank' );
	} );

	it( 'opens the requested detail tab when a section is given', () => {
		render( <LeaderboardPostLabel id={ 12 } label="Newsletter" section="email-opens" /> );

		expect( screen.getByRole( 'link', { name: 'Newsletter' } ) ).toHaveAttribute(
			'href',
			'/post/12?from=2026-06-01&section=email-opens'
		);
	} );

	it( 'falls back to the public URL when there is no post ID', () => {
		render( <LeaderboardPostLabel label="Untracked page" link="https://example.com/untracked/" /> );

		const link = screen.getByRole( 'link', { name: /Untracked page/ } );
		expect( link ).toHaveAttribute( 'href', 'https://example.com/untracked/' );
		expect( link ).toHaveAttribute( 'target', '_blank' );
	} );

	it( 'renders plain text when the row has neither a post ID nor a safe URL', () => {
		render( <LeaderboardPostLabel label="Untitled" link="javascript:alert(1)" /> );

		expect( screen.getByText( 'Untitled' ) ).toBeInTheDocument();
		expect( screen.queryByRole( 'link' ) ).not.toBeInTheDocument();
	} );
} );
