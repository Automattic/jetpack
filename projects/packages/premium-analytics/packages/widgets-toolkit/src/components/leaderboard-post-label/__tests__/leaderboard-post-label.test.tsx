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
	mockUseWidgetRootContext.mockReturnValue( {
		reportParams: { from: '2026-06-01' },
		navigationParams: {
			from: '2026-06-01',
			comp: '1',
			compare_from: '2026-05-01',
			compare_to: '2026-05-31',
		},
	} );
} );

describe( 'LeaderboardPostLabel', () => {
	it( 'links a post to its detail route with the report window, origin and tab', () => {
		render(
			<LeaderboardPostLabel
				id={ 12 }
				label="Hello world"
				link="https://example.com/hello/"
				section="email-opens"
				origin={ { report: 'posts', section: 'posts-pages' } }
			/>
		);

		const link = screen.getByRole( 'link', { name: 'Hello world' } );
		const url = new URL( link.getAttribute( 'href' ) ?? '', 'https://example.com' );

		expect( url.pathname ).toBe( '/post/12' );
		expect( url.searchParams.get( 'from' ) ).toBe( '2026-06-01' );
		expect( url.searchParams.get( 'comp' ) ).toBe( '1' );
		expect( url.searchParams.get( 'post_url' ) ).toBe( 'https://example.com/hello/' );
		expect( url.searchParams.get( 'section' ) ).toBe( 'email-opens' );
		expect( url.searchParams.get( 'ref' ) ).toBe( 'posts' );
		expect( url.searchParams.get( 'ref_section' ) ).toBe( 'posts-pages' );
	} );
} );
