/**
 * External dependencies
 */
import { useSectionTab } from '@jetpack-premium-analytics/routing';
import {
	ReportErrorState,
	ReportPageTabs,
	ReportRecordsTable,
} from '@jetpack-premium-analytics/widgets-toolkit';
import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
/**
 * Internal dependencies
 */
import { useLocationsReportRecords } from './config';
import LocationsReportPage from './page';
import type { LocationRow, ReportLocationsTabId } from './config';
import type { ReactNode } from 'react';

jest.mock( './config', () => ( {
	...jest.requireActual( './config' ),
	useLocationsReportRecords: jest.fn(),
} ) );

jest.mock( '@jetpack-premium-analytics/routing', () => ( {
	...jest.requireActual( '@jetpack-premium-analytics/routing' ),
	useDashboardLink: () => '/',
	useReportDateFilters: () => ( {} ),
	useSectionTab: jest.fn(),
} ) );

jest.mock( '@jetpack-premium-analytics/ui', () => ( {
	DateFiltersPanel: () => null,
} ) );

jest.mock( '@jetpack-premium-analytics/widgets-toolkit', () => ( {
	flagUrl: ( countryCode: string ) => `https://example.com/${ countryCode }.svg`,
	ReportErrorState: jest.fn( ( { title, onRetry }: { title: string; onRetry: () => void } ) => (
		<div data-testid="report-error-state">
			<span>{ title }</span>
			<button onClick={ onRetry }>Retry</button>
		</div>
	) ),
	ReportPageLayout: ( { tabs, children }: { tabs: ReactNode; children: ReactNode } ) => (
		<>
			{ tabs }
			{ children }
		</>
	),
	ReportPageShell: ( { children }: { children: ReactNode } ) => <>{ children }</>,
	ReportPageTabs: jest.fn( () => null ),
	// Render the toolbar slot so the country filter is assertable; the table
	// itself is covered by its own tests.
	ReportRecordsTable: jest.fn( ( { header }: { header?: ReactNode } ) => (
		<div data-testid="records-table">{ header }</div>
	) ),
	useReportRetry: ( refetch: () => unknown ) => () => {
		void refetch();
	},
} ) );

jest.mock( '@wordpress/admin-ui', () => ( {
	Breadcrumbs: () => null,
} ) );

jest.mock( '@wordpress/route', () => ( {
	useSearch: () => ( {
		from: '2026-06-01T00:00:00+02:00',
		to: '2026-06-30T23:59:59+02:00',
		interval: 'day',
	} ),
} ) );

const useRecordsMock = jest.mocked( useLocationsReportRecords );
const useSectionTabMock = jest.mocked( useSectionTab );
const reportErrorStateMock = jest.mocked( ReportErrorState );
const reportPageTabsMock = jest.mocked( ReportPageTabs );
const reportRecordsTableMock = jest.mocked( ReportRecordsTable );

const row: LocationRow = {
	id: 'AU',
	label: 'Australia',
	countryCode: 'AU',
	countryFull: 'Australia',
	views: 15,
};

/**
 * Stub the records hook, settled with one populated row by default.
 *
 * @param overrides - Fields to override for the case under test.
 * @return The mocked records hook result.
 */
function mockRecords( overrides: Record< string, unknown > = {} ) {
	const records = {
		table: { rows: [ row ], isLoading: false },
		countries: {
			options: [
				{ code: 'AU', label: 'Australia' },
				{ code: 'DE', label: 'Germany' },
			],
		},
		isError: false,
		refetch: jest.fn(),
		...overrides,
	} as unknown as ReturnType< typeof useLocationsReportRecords >;

	useRecordsMock.mockReturnValue( records );

	return records;
}

/**
 * Drive the page's tab state with real state, so a tab change re-renders.
 *
 * @param initial - The tab the page starts on.
 */
function mockTabState( initial: ReportLocationsTabId ) {
	useSectionTabMock.mockImplementation(
		() => useState< ReportLocationsTabId >( initial ) as ReturnType< typeof useSectionTab >
	);
}

/**
 * Get the country filter, or null when the active tab renders none.
 *
 * @return The country filter combobox.
 */
function queryCountryFilter() {
	return screen.queryByRole( 'combobox', { name: 'Filter by country' } );
}

/**
 * Switch tabs through the tab strip's own change handler.
 *
 * @param tab - The tab to switch to.
 */
function selectTab( tab: ReportLocationsTabId ) {
	const { onChange } =
		reportPageTabsMock.mock.calls[ reportPageTabsMock.mock.calls.length - 1 ][ 0 ];

	act( () => {
		onChange( tab );
	} );
}

describe( 'LocationsReportPage', () => {
	beforeEach( () => {
		jest.clearAllMocks();
		mockTabState( 'countries' );
	} );

	it( 'hands the active tab rows to the records table', () => {
		mockRecords();

		render( <LocationsReportPage /> );

		expect( reportRecordsTableMock.mock.calls[ 0 ][ 0 ] ).toEqual(
			expect.objectContaining( {
				data: [ row ],
				isLoading: false,
				searchLabel: 'Search locations',
			} )
		);
	} );

	it( 'reports the loading state while the active tab is loading', () => {
		mockRecords( { table: { rows: [], isLoading: true } } );

		render( <LocationsReportPage /> );

		expect( reportRecordsTableMock.mock.calls[ 0 ][ 0 ] ).toEqual(
			expect.objectContaining( { data: [], isLoading: true } )
		);
	} );

	it( 'renders the error state instead of the records table', () => {
		mockRecords( { isError: true } );

		render( <LocationsReportPage /> );

		expect( screen.getByTestId( 'report-error-state' ) ).toHaveTextContent(
			'Unable to load locations'
		);
		expect( reportErrorStateMock ).toHaveBeenCalled();
		expect( reportRecordsTableMock ).not.toHaveBeenCalled();
	} );

	it( 'refetches the active tab when Retry is clicked', async () => {
		const records = mockRecords( { isError: true } );

		render( <LocationsReportPage /> );
		await userEvent.setup().click( screen.getByRole( 'button', { name: 'Retry' } ) );

		expect( records.refetch ).toHaveBeenCalledTimes( 1 );
	} );

	// The Countries tab is already the whole country list, so scoping it to one
	// country would leave a single row.
	it( 'renders no country filter on the Countries tab', () => {
		mockRecords();

		render( <LocationsReportPage /> );

		expect( queryCountryFilter() ).not.toBeInTheDocument();
	} );

	it.each( [
		[ 'regions', 'All regions' ],
		[ 'cities', 'All cities' ],
	] as const )( 'offers the countries to filter %s by', ( tab, allLabel ) => {
		mockTabState( tab );
		mockRecords();

		render( <LocationsReportPage /> );

		expect( queryCountryFilter() ).toBeInTheDocument();
		expect( screen.getAllByRole( 'option' ).map( option => option.textContent ) ).toEqual( [
			allLabel,
			'Australia',
			'Germany',
		] );
	} );

	it( 'scopes the records request to the picked country', async () => {
		mockTabState( 'regions' );
		mockRecords();

		render( <LocationsReportPage /> );
		await userEvent.setup().selectOptions( queryCountryFilter() as HTMLElement, 'DE' );

		expect( useRecordsMock ).toHaveBeenLastCalledWith( 'regions', expect.anything(), 'DE' );
	} );

	// A country picked on one tab does not carry to the next: a country with
	// regions may have no cities, which would otherwise show an empty table
	// under a country the user cannot see they still have selected.
	it( 'clears the picked country when the tab changes', async () => {
		mockTabState( 'regions' );
		mockRecords();

		render( <LocationsReportPage /> );
		await userEvent.setup().selectOptions( queryCountryFilter() as HTMLElement, 'DE' );
		expect( useRecordsMock ).toHaveBeenLastCalledWith( 'regions', expect.anything(), 'DE' );

		selectTab( 'cities' );

		expect( useRecordsMock ).toHaveBeenLastCalledWith( 'cities', expect.anything(), undefined );
		expect( queryCountryFilter() ).toHaveValue( '' );
	} );
} );
