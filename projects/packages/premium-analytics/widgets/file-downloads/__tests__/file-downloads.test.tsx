/**
 * External dependencies
 */
import { queryClient } from '@jetpack-premium-analytics/data';
import { render, screen } from '@testing-library/react';
import apiFetch from '@wordpress/api-fetch';
import type { AnchorHTMLAttributes, ReactNode } from 'react';
/**
 * Internal dependencies
 */
import FileDownloadsWidget from '../render';

jest.mock( '@wordpress/api-fetch', () => jest.fn() );

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

const mockApiFetch = apiFetch as unknown as jest.Mock;

describe( 'FileDownloadsWidget', () => {
	beforeEach( () => {
		queryClient.clear();
		mockApiFetch.mockReset();
		mockApiFetch.mockResolvedValue( { date: '2026-06-22', days: {} } );
	} );

	it( 'links to the Downloads report', () => {
		render( <FileDownloadsWidget attributes={ { max: 10 } } /> );

		expect( screen.getByRole( 'link', { name: 'See report' } ) ).toHaveAttribute(
			'href',
			expect.stringContaining( '/reports/downloads' )
		);
	} );
} );
