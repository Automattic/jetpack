/**
 * External dependencies
 */
import { render, screen } from '@testing-library/react';
import type { AnchorHTMLAttributes, ReactNode } from 'react';
/**
 * Internal dependencies
 */
import SearchTermsWidget from '../render';
import useSearchTermViews from '../use-search-term-views';

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
	useSearch: () => ( {} ),
} ) );

jest.mock( '../use-search-term-views' );

const mockUseSearchTermViews = jest.mocked( useSearchTermViews );

describe( 'SearchTermsWidget', () => {
	beforeEach( () => {
		mockUseSearchTermViews.mockReturnValue( {
			data: [],
			isLoading: false,
			isFetching: false,
			isError: false,
			hasComparison: false,
			refetch: jest.fn(),
		} );
	} );

	it( 'links to the Search Terms report', () => {
		render( <SearchTermsWidget attributes={ {} } /> );

		expect( screen.getByRole( 'link', { name: 'See report' } ) ).toHaveAttribute(
			'href',
			expect.stringContaining( '/reports/search-terms' )
		);
	} );
} );
