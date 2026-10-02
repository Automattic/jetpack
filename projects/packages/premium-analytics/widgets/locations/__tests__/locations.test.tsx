/**
 * External dependencies
 */
import { queryClient } from '@jetpack-premium-analytics/data';
import {
	LocationsGeoChart,
	locationsCsvExporter,
} from '@jetpack-premium-analytics/widgets-toolkit';
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

// The map loads Google Charts asynchronously, and what it draws is covered by
// its own tests; here only the props the widget hands it matter.
jest.mock( '@jetpack-premium-analytics/widgets-toolkit', () => {
	const actual = jest.requireActual( '@jetpack-premium-analytics/widgets-toolkit' );

	return {
		...actual,
		LocationsGeoChart: jest.fn( () => <div data-testid="geo-chart" /> ),
		locationsCsvExporter: jest.fn( actual.locationsCsvExporter ),
	};
} );

// Typed off the hook so the mocked state and the rows passed to
// `mockReturnValue` are type-checked rather than cast away.
type LocationViewsState = ReturnType< typeof import( '../use-location-views' ).default >;

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
const locationsGeoChartMock = jest.mocked( LocationsGeoChart );
const locationsCsvExporterMock = jest.mocked( locationsCsvExporter );

/** Read the props of the map's latest render. */
function lastMapProps() {
	return locationsGeoChartMock.mock.calls[ locationsGeoChartMock.mock.calls.length - 1 ][ 0 ];
}

jest.mock( '../use-location-views', () => ( {
	__esModule: true,
	default: ( ...args: unknown[] ) => mockUseLocationViews( ...( args as [] ) ),
} ) );

describe( 'LocationsWidget', () => {
	beforeEach( () => {
		mockUseLocationViews.mockReset();
		mockUseLocationViews.mockReturnValue( LOADING_STATE );
	} );

	// The map waits for the country, so the lookup has to be under way before the
	// rows arrive or it delays the map.
	it( "starts the viewer's country lookup while the rows are still loading", () => {
		queryClient.clear();
		// jsdom has no `fetch`, so there is nothing for `jest.spyOn()` to wrap.
		// eslint-disable-next-line jest/prefer-spy-on
		globalThis.fetch = jest.fn( () => new Promise< Response >( () => {} ) );

		try {
			render( <LocationsWidget attributes={ {} } /> );

			expect( globalThis.fetch ).toHaveBeenCalledWith(
				'https://public-api.wordpress.com/geo/',
				expect.anything()
			);
			expect( locationsGeoChartMock ).not.toHaveBeenCalled();
		} finally {
			delete ( globalThis as { fetch?: unknown } ).fetch;
		}
	} );

	it( 'offers no download while the rows on screen are still loading', () => {
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
			hasData: true,
		} );

		render( <LocationsWidget attributes={ { geoGranularity: 'country' } } /> );

		expect( screen.queryByRole( 'button', { name: /Download CSV/ } ) ).not.toBeInTheDocument();
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

	// Regions mode is worldwide until a row is drilled into.
	it( 'requests unfiltered region rows in Regions mode', () => {
		render( <LocationsWidget attributes={ { geoGranularity: 'region' } } /> );

		expect( mockUseLocationViews ).toHaveBeenLastCalledWith(
			expect.objectContaining( { geoMode: 'region', filter: undefined } )
		);
	} );

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
			expect.objectContaining( { geoMode: 'region', filter: { country: 'US' } } )
		);
		expect( lastMapProps() ).toMatchObject( {
			mode: 'region',
			focusCountry: { code: 'US', name: 'United States' },
			rows: [
				{ label: 'United States', value: 10, countryCode: 'US', countryFull: 'United States' },
			],
		} );

		rerender( <LocationsWidget attributes={ { geoGranularity: 'region' } } /> );

		expect( mockUseLocationViews ).toHaveBeenLastCalledWith(
			expect.objectContaining( { geoMode: 'region', filter: undefined } )
		);
		// Regions mode keeps the map alongside the leaderboard, worldwide again.
		expect( screen.getByTestId( 'geo-chart' ) ).toBeInTheDocument();
		expect( lastMapProps() ).toMatchObject( { mode: 'region', focusCountry: undefined } );

		rerender( <LocationsWidget attributes={ { geoGranularity: 'country' } } /> );

		expect( mockUseLocationViews ).toHaveBeenLastCalledWith(
			expect.objectContaining( { geoMode: 'country', filter: undefined } )
		);
	} );

	it( 'lists an unknown country without mapping or drilling down', () => {
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
				{
					key: ':Unknown',
					label: 'Unknown',
					countryCode: '',
					countryFull: 'Unknown',
					value: 4,
					region: '',
				},
			],
			isLoading: false,
			isFetching: false,
			hasData: true,
		} );

		render( <LocationsWidget attributes={ {} } /> );

		expect( screen.getByText( 'Unknown' ) ).toBeInTheDocument();
		expect(
			screen.getByRole( 'button', { name: 'View regions in United States' } )
		).toBeInTheDocument();
		expect(
			screen.queryByRole( 'button', { name: 'View regions in Unknown' } )
		).not.toBeInTheDocument();
		expect( lastMapProps().rows ).toEqual( [ expect.objectContaining( { countryCode: 'US' } ) ] );
	} );

	describe( 'region drill-down', () => {
		const ROWS_BY_MODE: Record< string, LocationViewsState[ 'data' ] > = {
			country: [ locationRow( 'United States' ) ],
			region: [ locationRow( 'Minnesota' ) ],
			city: [ locationRow( 'Saint Cloud' ) ],
		};

		function locationRow( label: string ): LocationViewsState[ 'data' ][ number ] {
			return {
				key: `US:${ label }`,
				label,
				countryCode: 'US',
				countryFull: 'United States',
				value: 10,
				region: '',
			};
		}

		beforeEach( () => {
			mockUseLocationViews.mockImplementation( ( ( { geoMode }: { geoMode: string } ) => ( {
				...LOADING_STATE,
				data: ROWS_BY_MODE[ geoMode ],
				isLoading: false,
				isFetching: false,
				hasData: true,
			} ) ) as unknown as () => LocationViewsState );
		} );

		it( 'drills from a country to a region to its cities, and back one level at a time', async () => {
			render( <LocationsWidget attributes={ { geoGranularity: 'country' } } /> );

			await userEvent.click(
				screen.getByRole( 'button', { name: 'View regions in United States' } )
			);
			await userEvent.click( screen.getByRole( 'button', { name: 'View cities in Minnesota' } ) );

			expect( mockUseLocationViews ).toHaveBeenLastCalledWith(
				expect.objectContaining( {
					geoMode: 'city',
					filter: { country: 'US', region: 'Minnesota' },
				} )
			);
			expect( lastMapProps() ).toMatchObject( {
				mode: 'city',
				focusCountry: { code: 'US', name: 'United States' },
			} );
			expect( screen.queryByRole( 'button', { name: /View cities in/ } ) ).not.toBeInTheDocument();
			expect( screen.getByText( 'Minnesota' ) ).toBeInTheDocument();
			expect( screen.queryByRole( 'button', { name: /Minnesota/ } ) ).not.toBeInTheDocument();

			const countryBackLink = screen.getByRole( 'button', {
				name: 'View regions in United States',
			} );
			expect( countryBackLink ).toHaveTextContent( 'United States' );
			await userEvent.click( countryBackLink );

			expect( mockUseLocationViews ).toHaveBeenLastCalledWith(
				expect.objectContaining( {
					geoMode: 'region',
					filter: { country: 'US', region: undefined },
				} )
			);
			expect( screen.getByText( 'United States' ) ).toBeInTheDocument();
			expect( screen.queryByRole( 'button', { name: /United States/ } ) ).not.toBeInTheDocument();

			await userEvent.click( screen.getByRole( 'button', { name: 'View all locations' } ) );

			expect( mockUseLocationViews ).toHaveBeenLastCalledWith(
				expect.objectContaining( { geoMode: 'country', filter: undefined } )
			);
		} );

		it( 'drills from Regions mode straight to a region’s cities, and back to all regions', async () => {
			render( <LocationsWidget attributes={ { geoGranularity: 'region' } } /> );

			await userEvent.click( screen.getByRole( 'button', { name: 'View cities in Minnesota' } ) );

			expect( mockUseLocationViews ).toHaveBeenLastCalledWith(
				expect.objectContaining( {
					geoMode: 'city',
					filter: { country: 'US', region: 'Minnesota' },
				} )
			);

			await userEvent.click( screen.getByRole( 'button', { name: 'View all locations' } ) );

			expect( mockUseLocationViews ).toHaveBeenLastCalledWith(
				expect.objectContaining( {
					geoMode: 'region',
					filter: undefined,
				} )
			);
		} );

		it( 'drops a drilled-down region when switching modes', async () => {
			const { rerender } = render(
				<LocationsWidget attributes={ { geoGranularity: 'region' } } />
			);
			await userEvent.click( screen.getByRole( 'button', { name: 'View cities in Minnesota' } ) );

			mockUseLocationViews.mockClear();
			rerender( <LocationsWidget attributes={ { geoGranularity: 'country' } } /> );

			expect( mockUseLocationViews ).not.toHaveBeenCalledWith(
				expect.objectContaining( { filter: expect.objectContaining( { region: 'Minnesota' } ) } )
			);

			rerender( <LocationsWidget attributes={ { geoGranularity: 'region' } } /> );

			expect( mockUseLocationViews ).toHaveBeenLastCalledWith(
				expect.objectContaining( { geoMode: 'region', filter: undefined } )
			);
		} );

		it( 'scopes the download to the place the widget is drilled into', async () => {
			render( <LocationsWidget attributes={ { geoGranularity: 'country' } } /> );

			expect( screen.getByRole( 'button', { name: /Download CSV/ } ) ).toBeInTheDocument();
			expect( locationsCsvExporterMock ).toHaveBeenLastCalledWith( 'countries', undefined );

			await userEvent.click(
				screen.getByRole( 'button', { name: 'View regions in United States' } )
			);
			expect( locationsCsvExporterMock ).toHaveBeenLastCalledWith( 'regions', {
				country: 'US',
				region: undefined,
			} );

			await userEvent.click( screen.getByRole( 'button', { name: 'View cities in Minnesota' } ) );
			expect( locationsCsvExporterMock ).toHaveBeenLastCalledWith( 'cities', {
				country: 'US',
				region: 'Minnesota',
			} );

			await userEvent.click(
				screen.getByRole( 'button', { name: 'View regions in United States' } )
			);
			await userEvent.click( screen.getByRole( 'button', { name: 'View all locations' } ) );
			expect( locationsCsvExporterMock ).toHaveBeenLastCalledWith( 'countries', undefined );
		} );

		it( 'offers no drill-down in Cities mode', () => {
			render( <LocationsWidget attributes={ { geoGranularity: 'city' } } /> );

			expect( screen.queryByRole( 'button', { name: /^View / } ) ).not.toBeInTheDocument();
		} );
	} );
} );
