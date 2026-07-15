/**
 * External dependencies
 */
import { render, screen } from '@testing-library/react';
import type { AnchorHTMLAttributes, ReactNode } from 'react';
/**
 * Internal dependencies
 */
import UtmInsightsWidget from '../render';

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

jest.mock( '../use-utm-insights', () => ( {
	__esModule: true,
	default: () => ( {
		data: [],
		hasComparison: false,
		isLoading: false,
		isFetching: false,
		hasData: false,
		isError: false,
	} ),
} ) );

describe( 'UtmInsightsWidget', () => {
	it( 'links to the UTM report', () => {
		render( <UtmInsightsWidget attributes={ {} } /> );

		expect( screen.getByRole( 'link', { name: 'See report' } ) ).toHaveAttribute(
			'href',
			expect.stringContaining( '/reports/utm' )
		);
		expect( screen.getByRole( 'link', { name: 'See report' } ) ).toHaveAttribute(
			'href',
			expect.stringContaining( 'section=source-medium' )
		);
	} );

	it( 'links the combined campaign dimension to its matching report tab', () => {
		render(
			<UtmInsightsWidget attributes={ { utmDimension: 'utm_campaign,utm_source,utm_medium' } } />
		);

		expect( screen.getByRole( 'link', { name: 'See report' } ) ).toHaveAttribute(
			'href',
			expect.stringContaining( 'section=campaign-source-medium' )
		);
	} );
} );
