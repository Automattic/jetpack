/**
 * External dependencies
 */
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
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

// Google Charts loads asynchronously and is outside this widget's concern.
jest.mock( '@jetpack-premium-analytics/widgets-toolkit', () => ( {
	...jest.requireActual( '@jetpack-premium-analytics/widgets-toolkit' ),
	GeoChart: () => <div data-testid="geo-chart" />,
} ) );

const LOADING_STATE = {
	data: [],
	hasComparison: false,
	isLoading: true,
	isFetching: true,
	hasData: false,
	isError: false,
	isPlaceholderData: false,
	refetch: () => {},
};

const mockUseLocationViews = jest.fn( () => LOADING_STATE );

jest.mock( '../use-location-views', () => ( {
	__esModule: true,
	default: ( ...args: unknown[] ) => mockUseLocationViews( ...( args as [] ) ),
} ) );

describe( 'LocationsWidget', () => {
	beforeEach( () => {
		mockUseLocationViews.mockReset();
		mockUseLocationViews.mockReturnValue( LOADING_STATE );
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
	] as const )( 'opens the %s granularity on the %s report tab', ( geoGranularity, section ) => {
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

	// Without the reset, the drill-down survives the trip through Regions and
	// Countries mode comes back scoped to one country instead of listing them all.
	it( 'drops a drilled-down country when switching to Regions', async () => {
		mockUseLocationViews.mockReturnValue( {
			...LOADING_STATE,
			data: [
				{
					key: 'US:United States',
					label: 'United States',
					countryCode: 'US',
					countryFull: 'United States',
					value: 10,
					region: '',
				},
			],
			isLoading: false,
			isFetching: false,
			hasData: true,
		} as unknown as typeof LOADING_STATE );

		const { rerender } = render( <LocationsWidget attributes={ { geoGranularity: 'country' } } /> );
		await userEvent.click(
			screen.getByRole( 'button', { name: 'View regions in United States' } )
		);

		expect( mockUseLocationViews ).toHaveBeenLastCalledWith(
			expect.objectContaining( { geoMode: 'region', countryFilter: 'US' } )
		);

		rerender( <LocationsWidget attributes={ { geoGranularity: 'region' } } /> );

		expect( mockUseLocationViews ).toHaveBeenLastCalledWith(
			expect.objectContaining( { geoMode: 'region', countryFilter: undefined } )
		);

		rerender( <LocationsWidget attributes={ { geoGranularity: 'country' } } /> );

		expect( mockUseLocationViews ).toHaveBeenLastCalledWith(
			expect.objectContaining( { geoMode: 'country', countryFilter: undefined } )
		);
	} );
} );
