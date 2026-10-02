/**
 * External dependencies
 */
import { queryClient } from '@jetpack-premium-analytics/data';
import { LeaderboardChart, LocationsGeoChart } from '@jetpack-premium-analytics/widgets-toolkit';
import { act, render, screen } from '@testing-library/react';
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
		// Spied, because CSS modules resolve to nothing here and its `loading` dimming is a class.
		LeaderboardChart: jest.fn( actual.LeaderboardChart ),
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

/** Read the props of the map's latest render. */
function lastMapProps() {
	return locationsGeoChartMock.mock.calls[ locationsGeoChartMock.mock.calls.length - 1 ][ 0 ];
}

/** Read the props of the leaderboard's latest render. */
function lastLeaderboardProps() {
	const { calls } = jest.mocked( LeaderboardChart ).mock;
	return calls[ calls.length - 1 ][ 0 ];
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

		describe( 'while the next level loads', () => {
			type ViewsArgs = { geoMode: string };
			// `placeholderData` hands back the previous level's rows until the new ones arrive.
			let isPending: ( args: ViewsArgs ) => boolean;
			// What the hook returns mid-load when a comparison makes the two queries land apart.
			let pendingRows: LocationViewsState[ 'data' ] | undefined;
			let rowsFor: ( geoMode: string ) => LocationViewsState[ 'data' ];
			// A fresh element each time, or `rerender` bails out on the unchanged one.
			const countryWidget = ( preset: 'last-30-days' | 'last-7-days' = 'last-30-days' ) => (
				<LocationsWidget attributes={ { geoGranularity: 'country', reportParams: { preset } } } />
			);

			beforeEach( () => {
				isPending = () => false;
				pendingRows = undefined;
				rowsFor = geoMode => ROWS_BY_MODE[ geoMode ];
				let shownRows = ROWS_BY_MODE.country;
				mockUseLocationViews.mockImplementation( ( ( args: ViewsArgs ) => {
					if ( isPending( args ) ) {
						return { ...LOADING_STATE, data: pendingRows ?? shownRows, hasData: true };
					}
					shownRows = rowsFor( args.geoMode );
					return {
						...LOADING_STATE,
						data: shownRows,
						isLoading: false,
						isFetching: false,
						hasData: true,
					};
				} ) as unknown as () => LocationViewsState );
			} );

			it( 'keeps the previous level dimmed and inert, and moves the map on', async () => {
				isPending = ( { geoMode } ) => geoMode === 'region';
				const { rerender } = render( countryWidget() );

				await userEvent.click(
					screen.getByRole( 'button', { name: 'View regions in United States' } )
				);

				expect( screen.queryByTestId( 'widget-skeleton' ) ).not.toBeInTheDocument();
				const staleList = screen.getByTestId( 'leaderboard-chart-container' );
				expect( staleList ).toHaveTextContent( 'United States' );
				// eslint-disable-next-line testing-library/no-node-access -- jsdom does not honour `inert`, so the attribute itself is the assertion.
				expect( staleList.closest( '[inert]' ) ).not.toBeNull();
				expect( lastLeaderboardProps().loading ).toBe( true );
				expect(
					screen.queryByRole( 'button', { name: 'View regions in United States' } )
				).not.toBeInTheDocument();
				expect( lastMapProps() ).toMatchObject( {
					mode: 'region',
					focusCountry: { code: 'US', name: 'United States' },
					rows: [],
				} );

				isPending = () => false;
				rerender( countryWidget() );

				const freshRow = screen.getByRole( 'button', { name: 'View cities in Minnesota' } );
				// eslint-disable-next-line testing-library/no-node-access -- see above.
				expect( freshRow.closest( '[inert]' ) ).toBeNull();
				expect( lastLeaderboardProps().loading ).toBe( false );
				expect( lastMapProps().rows ).toEqual( [
					expect.objectContaining( { label: 'Minnesota' } ),
				] );
			} );

			it.each( [
				[ 'no rows', [] ],
				[ "the next level's rows", ROWS_BY_MODE.region ],
			] )( 'holds the previous level while one query has landed with %s', async ( _, rows ) => {
				isPending = ( { geoMode } ) => geoMode === 'region';
				pendingRows = rows;
				render( countryWidget() );

				await userEvent.click(
					screen.getByRole( 'button', { name: 'View regions in United States' } )
				);

				expect( screen.queryByTestId( 'widget-skeleton' ) ).not.toBeInTheDocument();
				expect( screen.getByTestId( 'leaderboard-chart-container' ) ).toHaveTextContent(
					'United States'
				);
				expect( screen.queryByText( 'Minnesota' ) ).not.toBeInTheDocument();
			} );

			it( 'keeps keyboard focus in the widget when a row is drilled into', async () => {
				isPending = ( { geoMode } ) => geoMode === 'region';
				render( countryWidget() );

				act( () =>
					screen.getByRole( 'button', { name: 'View regions in United States' } ).focus()
				);
				await userEvent.keyboard( '{Enter}' );

				expect( document.body ).not.toHaveFocus();
				// eslint-disable-next-line @wordpress/no-global-active-element, testing-library/no-node-access -- which element the browser focused is the assertion, and the widget's state root is deliberately not queryable.
				expect( document.activeElement ).toHaveAttribute( 'tabindex', '-1' );
			} );

			it( 'still shows the skeleton when the current level reloads', () => {
				const { rerender } = render( countryWidget() );

				isPending = () => true;
				rerender( countryWidget() );

				expect( screen.getByTestId( 'widget-skeleton' ) ).toBeInTheDocument();
			} );

			it( 'shows the skeleton when leaving an empty level', async () => {
				// One array, as the real hook memoizes its rows.
				const noRows: LocationViewsState[ 'data' ] = [];
				rowsFor = geoMode => ( geoMode === 'region' ? noRows : ROWS_BY_MODE[ geoMode ] );
				render( countryWidget() );
				await userEvent.click(
					screen.getByRole( 'button', { name: 'View regions in United States' } )
				);

				isPending = ( { geoMode } ) => geoMode === 'country';
				await userEvent.click( screen.getByRole( 'button', { name: 'View all locations' } ) );

				expect( screen.getByTestId( 'widget-skeleton' ) ).toBeInTheDocument();
			} );

			it( 'shows the skeleton when the date range changes mid drill-down', async () => {
				isPending = ( { geoMode } ) => geoMode === 'region';
				const { rerender } = render( countryWidget() );
				await userEvent.click(
					screen.getByRole( 'button', { name: 'View regions in United States' } )
				);

				isPending = () => true;
				rerender( countryWidget( 'last-7-days' ) );

				expect( screen.getByTestId( 'widget-skeleton' ) ).toBeInTheDocument();
			} );

			it( 'shows the skeleton when going back after a date range change', async () => {
				const { rerender } = render( countryWidget() );
				await userEvent.click(
					screen.getByRole( 'button', { name: 'View regions in United States' } )
				);

				isPending = () => true;
				rerender( countryWidget( 'last-7-days' ) );
				await userEvent.click( screen.getByRole( 'button', { name: 'View all locations' } ) );

				expect( screen.getByTestId( 'widget-skeleton' ) ).toBeInTheDocument();
			} );
		} );

		it( 'offers no drill-down in Cities mode', () => {
			render( <LocationsWidget attributes={ { geoGranularity: 'city' } } /> );

			expect( screen.queryByRole( 'button', { name: /^View / } ) ).not.toBeInTheDocument();
		} );
	} );
} );
