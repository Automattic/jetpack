/**
 * External dependencies
 */
import {
	getDefaultQueryParams,
	GlobalErrorProvider,
	queryClient,
} from '@jetpack-premium-analytics/data';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import apiFetch from '@wordpress/api-fetch';
import type { AnchorHTMLAttributes, ReactElement, ReactNode } from 'react';
/**
 * Internal dependencies
 */
import AuthorsWidget from '../render';

jest.mock( '@wordpress/api-fetch', () => jest.fn() );

type MockRouteLinkProps = {
	to: string;
	params?: Record< string, unknown >;
	search?: Record< string, unknown >;
	children: ReactNode;
} & Omit< AnchorHTMLAttributes< HTMLAnchorElement >, 'href' >;

// WidgetRoot reads URL search params as a fallback for report params; outside
// a matched route the real hook warns and throws.
jest.mock( '@wordpress/route', () => ( {
	Link: ( { to, params, search, children, ...props }: MockRouteLinkProps ) => {
		const path = Object.entries( params ?? {} ).reduce(
			( acc, [ key, value ] ) => acc.replace( `$${ key }`, String( value ) ),
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

// The dashboard provides global error state around widgets, so match that
// production context in this render-level smoke test.
const renderInDashboard = ( ui: ReactElement ) =>
	render( <GlobalErrorProvider>{ ui }</GlobalErrorProvider> );

describe( 'AuthorsWidget', () => {
	beforeEach( () => {
		queryClient.clear();
		mockApiFetch.mockReset();
		mockApiFetch.mockResolvedValue( {
			date: '2026-07-17',
			period: 'day',
			summary: { authors: [] },
		} );
	} );

	it( 'passes max zero through to request all authors', async () => {
		renderInDashboard(
			<AuthorsWidget
				attributes={ { max: 0, reportParams: getDefaultQueryParams( false, 'last-7-days' ) } }
			/>
		);

		await waitFor( () =>
			expect( mockApiFetch ).toHaveBeenCalledWith(
				expect.objectContaining( {
					path: expect.stringMatching( /[?&]max=0(?:&|$)/ ),
				} )
			)
		);
	} );

	it( 'links to the Authors report', () => {
		renderInDashboard( <AuthorsWidget attributes={ { max: 7 } } /> );

		expect( screen.getByRole( 'link', { name: 'See report' } ) ).toHaveAttribute(
			'href',
			expect.stringContaining( '/reports/authors' )
		);
	} );

	it( 'links a drilled-down author post to its detail page', async () => {
		const user = userEvent.setup();
		mockApiFetch.mockResolvedValue( {
			date: '2026-07-17',
			period: 'day',
			summary: {
				authors: [
					{
						author_id: 101,
						name: 'Jane Cooper',
						views: 20,
						posts: [
							{
								id: 123,
								title: 'Quarterly update',
								url: 'https://example.com/quarterly-update/',
								views: 20,
							},
						],
					},
				],
			},
		} );

		renderInDashboard(
			<AuthorsWidget
				attributes={ {
					max: 7,
					reportParams: getDefaultQueryParams( false, 'last-7-days' ),
				} }
			/>
		);

		await user.click( await screen.findByRole( 'button', { name: 'View posts by Jane Cooper' } ) );

		const link = screen.getByRole( 'link', { name: 'Quarterly update' } );
		const url = new URL( link.getAttribute( 'href' ) ?? '', 'https://example.com' );

		expect( url.pathname ).toBe( '/post/123' );
		expect( url.searchParams.get( 'post_url' ) ).toBe( 'https://example.com/quarterly-update/' );
	} );
} );
