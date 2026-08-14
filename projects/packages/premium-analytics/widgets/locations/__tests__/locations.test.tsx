/**
 * External dependencies
 */
import { render, screen } from '@testing-library/react';
import type { AnchorHTMLAttributes, ReactNode } from 'react';
/**
 * Internal dependencies
 */
import LocationsWidget from '../render';

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

const mockUseLocationViews = jest.fn( () => ( {
	data: [],
	comparisonData: [],
	hasComparison: false,
	isLoading: true,
	isFetching: true,
	hasData: false,
	isError: false,
	isPlaceholderData: false,
} ) );

jest.mock( '../use-location-views', () => ( {
	__esModule: true,
	default: ( ...args: unknown[] ) => mockUseLocationViews( ...( args as [] ) ),
} ) );

describe( 'LocationsWidget', () => {
	beforeEach( () => {
		mockUseLocationViews.mockClear();
	} );

	it( 'links to the Locations report', () => {
		render( <LocationsWidget attributes={ {} } /> );

		expect( screen.getByRole( 'link', { name: 'View all' } ) ).toHaveAttribute(
			'href',
			expect.stringContaining( '/reports/locations' )
		);
	} );

	it.each( [
		[ undefined, 'countries' ],
		[ 'country', 'countries' ],
		[ 'region', 'regions' ],
		[ 'city', 'cities' ],
	] as const )( 'opens the %s report tab for the %s granularity', ( geoGranularity, section ) => {
		render( <LocationsWidget attributes={ geoGranularity ? { geoGranularity } : {} } /> );

		expect( screen.getByRole( 'link', { name: 'View all' } ) ).toHaveAttribute(
			'href',
			expect.stringContaining( `section=${ section }` )
		);
	} );

	// Regions mode is worldwide; only the country drill-down scopes it.
	it( 'requests unfiltered region rows in Regions mode', () => {
		render( <LocationsWidget attributes={ { geoGranularity: 'region' } } /> );

		expect( mockUseLocationViews ).toHaveBeenLastCalledWith(
			expect.objectContaining( { geoMode: 'region', countryFilter: undefined } )
		);
	} );
} );
