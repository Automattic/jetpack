/**
 * External dependencies
 */
import { useSectionTab } from '@jetpack-premium-analytics/routing';
import {
	ReportCsvAction,
	ReportErrorState,
	ReportPageTabs,
	ReportRecordsTable,
	useReportCsvExport,
} from '@jetpack-premium-analytics/widgets-toolkit';
import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
/**
 * Internal dependencies
 */
import { getLocationFields, useLocationsReportRecords } from './config';
import LocationsReportPage from './page';
import type { LocationRow, ReportLocationsTabId } from './config';
import type { View } from '@jetpack-premium-analytics/externals';
import type { ReactNode } from 'react';

jest.mock( './config', () => {
	const actual = jest.requireActual( './config' );

	return {
		...actual,
		getLocationFields: jest.fn( actual.getLocationFields ),
		useLocationsReportRecords: jest.fn(),
	};
} );

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
	ReportCsvAction: jest.fn( () => <button>Download</button> ),
	ReportPageShell: ( { actions, children }: { actions?: ReactNode; children: ReactNode } ) => (
		<>
			{ actions }
			{ children }
		</>
	),
	ReportPageTabs: jest.fn( () => null ),
	// The table's own tests cover how it renders the field config and reports
	// view changes; here only the props the page hands it matter.
	ReportRecordsTable: jest.fn( () => <div data-testid="records-table" /> ),
	useReportCsvExport: jest.fn(),
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
const reportCsvActionMock = jest.mocked( ReportCsvAction );
const useReportCsvExportMock = jest.mocked( useReportCsvExport );

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
		table: { rows: [ row ], isLoading: false, isFetching: false },
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
 * Get the country filter field handed to the records table, if the tab has one.
 *
 * @return The country field config.
 */
function queryCountryField() {
	const { fields } = reportRecordsTableMock.mock.calls[ 0 ][ 0 ];

	return fields.find( field => field.id === 'country' );
}

/**
 * Pick a country through the records table's own view change.
 *
 * @param countryCode - The ISO country code to filter by, or '' to clear.
 */
function pickCountry( countryCode: string ) {
	const { onChangeView } = reportRecordsTableMock.mock.calls[ 0 ][ 0 ];

	act( () => {
		onChangeView?.( {
			type: 'table',
			filters: countryCode ? [ { field: 'country', operator: 'is', value: countryCode } ] : [],
		} as View );
	} );
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
		useReportCsvExportMock.mockReturnValue( {
			canExport: false,
			rows: [],
			filename: 'locations-countries',
		} );
	} );

	it( 'offers a CSV export of the active tab', () => {
		mockTabState( 'regions' );
		const records = mockRecords();
		useReportCsvExportMock.mockReturnValue( {
			canExport: true,
			rows: [ row ],
			filename: 'locations-regions-2026-06-01_2026-06-30',
		} );

		render( <LocationsReportPage /> );

		expect( screen.getByRole( 'button', { name: 'Download' } ) ).toBeInTheDocument();
		expect( useReportCsvExportMock ).toHaveBeenCalledWith(
			expect.objectContaining( {
				rows: records.table.rows,
				filenamePrefix: 'locations-regions',
				status: records.table,
			} )
		);

		const { columns, rows: exportRows } = reportCsvActionMock.mock.calls[ 0 ][ 0 ];
		expect( columns.map( column => column.label ) ).toEqual( [ 'Location', 'Country', 'Views' ] );
		expect( exportRows.map( item => columns.map( column => column.getValue( item ) ) ) ).toEqual( [
			[ 'Australia', 'Australia', 15 ],
		] );
	} );

	it( 'omits the country column from the Countries export', () => {
		mockRecords();
		useReportCsvExportMock.mockReturnValue( {
			canExport: true,
			rows: [ row ],
			filename: 'locations-countries-2026-06-01_2026-06-30',
		} );

		render( <LocationsReportPage /> );

		const { columns } = reportCsvActionMock.mock.calls[ 0 ][ 0 ];
		expect( columns.map( column => column.label ) ).toEqual( [ 'Location', 'Views' ] );
	} );

	it( 'hides the CSV export until the rows are settled', () => {
		mockRecords();

		render( <LocationsReportPage /> );

		expect( screen.queryByRole( 'button', { name: 'Download' } ) ).not.toBeInTheDocument();
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
		mockRecords( { table: { rows: [], isLoading: true, isFetching: true } } );

		render( <LocationsReportPage /> );

		expect( reportRecordsTableMock.mock.calls[ 0 ][ 0 ] ).toEqual(
			expect.objectContaining( { data: [], isLoading: true } )
		);
	} );

	it( 'reports the loading state while the active tab refetches over cached rows', () => {
		mockRecords( { table: { rows: [ row ], isLoading: false, isFetching: true } } );

		render( <LocationsReportPage /> );

		expect( reportRecordsTableMock.mock.calls[ 0 ][ 0 ] ).toEqual(
			expect.objectContaining( { isLoading: true } )
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
	it( 'offers no country filter on the Countries tab', () => {
		mockRecords();

		render( <LocationsReportPage /> );

		expect( queryCountryField() ).toBeUndefined();
	} );

	// Unset by default, so the tab opens on every country until one is picked.
	it.each( [ 'regions', 'cities' ] as const )( 'offers the countries to filter %s by', tab => {
		mockTabState( tab );
		mockRecords();

		render( <LocationsReportPage /> );

		const countryField = queryCountryField();
		expect( countryField?.filterBy ).toEqual( { operators: [ 'is' ] } );
		expect( countryField?.elements ).toEqual( [
			{ value: 'AU', label: 'Australia' },
			{ value: 'DE', label: 'Germany' },
		] );
	} );

	it.each( [ true, false ] )( 'passes hasComparison=%s to the field config', hasComparison => {
		mockRecords( { hasComparison } );

		render( <LocationsReportPage /> );

		expect( getLocationFields ).toHaveBeenCalledWith( undefined, hasComparison );
	} );

	// The country is a filter, not a column.
	it( 'keeps the country out of the table columns', () => {
		mockTabState( 'regions' );
		mockRecords();

		render( <LocationsReportPage /> );

		expect( reportRecordsTableMock.mock.calls[ 0 ][ 0 ].initialView?.fields ).toEqual( [
			'location',
			'views',
		] );
	} );

	it( 'scopes the records request to the picked country', () => {
		mockTabState( 'regions' );
		mockRecords();

		render( <LocationsReportPage /> );
		pickCountry( 'DE' );

		expect( useRecordsMock ).toHaveBeenLastCalledWith( 'regions', expect.anything(), 'DE' );
	} );

	it( 'returns to every country when the filter is cleared', () => {
		mockTabState( 'regions' );
		mockRecords();

		render( <LocationsReportPage /> );
		pickCountry( 'DE' );
		pickCountry( '' );

		expect( useRecordsMock ).toHaveBeenLastCalledWith( 'regions', expect.anything(), undefined );
	} );

	// A country picked on one tab does not carry to the next: a country with
	// regions may have no cities, which would otherwise show an empty table
	// under a country the user cannot see they still have selected.
	it( 'clears the picked country when the tab changes', () => {
		mockTabState( 'regions' );
		mockRecords();

		render( <LocationsReportPage /> );
		pickCountry( 'DE' );
		expect( useRecordsMock ).toHaveBeenLastCalledWith( 'regions', expect.anything(), 'DE' );

		selectTab( 'cities' );

		expect( useRecordsMock ).toHaveBeenLastCalledWith( 'cities', expect.anything(), undefined );
	} );
} );
