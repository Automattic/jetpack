/**
 * External dependencies
 */
import { formatMetricValue } from '@jetpack-premium-analytics/formatters';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { AnchorHTMLAttributes, ReactNode } from 'react';
/**
 * Internal dependencies
 */
import LocationsWidget from '../render';
import type { LocationView } from '../use-location-views';

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

// Google Charts loads asynchronously and is outside this widget's concern. The
// map rows are an assertion target, so the stand-in carries its data prop.
jest.mock( '@jetpack-premium-analytics/widgets-toolkit', () => ( {
	...jest.requireActual( '@jetpack-premium-analytics/widgets-toolkit' ),
	GeoChart: ( { data }: { data: unknown } ) => (
		<div data-testid="geo-chart">{ JSON.stringify( data ) }</div>
	),
} ) );

// Typed off the hook so the mocked state and the rows passed to
// `mockReturnValue` are type-checked rather than cast away.
type LocationViewsState = ReturnType< typeof import('../use-location-views').default >;

const LOADING_STATE: LocationViewsState = {
	data: [],
	hasComparison: false,
	isLoading: true,
	isFetching: true,
	hasData: false,
	isError: false,
	refetch: () => {},
};

const mockUseLocationViews = jest.fn( () => LOADING_STATE );

jest.mock( '../use-location-views', () => ( {
	__esModule: true,
	default: ( ...args: unknown[] ) => mockUseLocationViews( ...( args as [] ) ),
} ) );

function locationView( label: string, countryCode: string, countryFull: string, value: number ) {
	return { key: `${ countryCode }:${ label }`, label, countryCode, countryFull, value, region: '' };
}

function viewsState( data: LocationView[] ): LocationViewsState {
	return { ...LOADING_STATE, data, isLoading: false, isFetching: false, hasData: data.length > 0 };
}

/**
 * Read the rows GeoChart was handed, as `[ header, ...rows ]`.
 */
function readGeoChartData() {
	return JSON.parse( screen.getByTestId( 'geo-chart' ).textContent ?? '[]' );
}

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
		[ 'default', 'countries' ],
		[ 'country', 'countries' ],
		[ 'region', 'regions' ],
		[ 'city', 'cities' ],
	] as const )( 'opens the %s granularity on the %s report tab', ( geoGranularity, section ) => {
		render(
			<LocationsWidget attributes={ geoGranularity === 'default' ? {} : { geoGranularity } } />
		);

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
		} );

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
		// Regions mode keeps the map alongside the leaderboard.
		expect( screen.getByTestId( 'geo-chart' ) ).toBeInTheDocument();

		rerender( <LocationsWidget attributes={ { geoGranularity: 'country' } } /> );

		expect( mockUseLocationViews ).toHaveBeenLastCalledWith(
			expect.objectContaining( { geoMode: 'country', countryFilter: undefined } )
		);
	} );

	describe( 'Regions view', () => {
		it( 'sums each country regions onto one map row', () => {
			mockUseLocationViews.mockReturnValue(
				viewsState( [
					locationView( 'Maharashtra', 'IN', 'India', 5447 ),
					locationView( 'Delhi', 'IN', 'India', 520 ),
					locationView( 'Illinois', 'US', 'United States', 2 ),
				] )
			);

			render( <LocationsWidget attributes={ { geoGranularity: 'region' } } /> );
			const [ , ...rows ] = readGeoChartData();

			expect( rows ).toHaveLength( 2 );
			expect( rows ).toContainEqual( [ { v: 'IN', f: 'India' }, 5967, expect.any( String ) ] );
			expect( rows ).toContainEqual( [ { v: 'US', f: 'United States' }, 2, expect.any( String ) ] );
		} );

		it( 'lists a country regions in its tooltip', () => {
			mockUseLocationViews.mockReturnValue(
				viewsState( [
					locationView( 'Maharashtra', 'IN', 'India', 5447 ),
					locationView( 'Delhi', 'IN', 'India', 520 ),
				] )
			);

			render( <LocationsWidget attributes={ { geoGranularity: 'region' } } /> );
			const [ header, row ] = readGeoChartData();

			expect( header[ 2 ] ).toMatchObject( { role: 'tooltip', p: { html: true } } );
			expect( row[ 2 ] ).toBe(
				`Maharashtra: ${ formatMetricValue( 5447 ) }<br />Delhi: ${ formatMetricValue( 520 ) }`
			);
		} );

		it( 'counts the regions it leaves out of a long tooltip', () => {
			mockUseLocationViews.mockReturnValue(
				viewsState(
					Array.from( { length: 12 }, ( _, index ) =>
						locationView( `Region ${ index }`, 'IN', 'India', 12 - index )
					)
				)
			);

			render( <LocationsWidget attributes={ { geoGranularity: 'region' } } /> );
			const [ , row ] = readGeoChartData();

			expect( row[ 2 ].split( '<br />' ) ).toHaveLength( 11 );
			expect( row[ 2 ] ).toContain( '…and 2 more locations' );
		} );
	} );

	it( 'gives the Cities view no tooltip column', () => {
		mockUseLocationViews.mockReturnValue(
			viewsState( [ locationView( 'Mumbai', 'IN', 'India', 900 ) ] )
		);

		render( <LocationsWidget attributes={ { geoGranularity: 'city' } } /> );
		const [ header, row ] = readGeoChartData();

		expect( header ).toHaveLength( 2 );
		expect( row ).toEqual( [ { v: 'IN', f: 'India' }, 900 ] );
	} );
} );
