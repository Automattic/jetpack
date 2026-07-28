/**
 * External dependencies
 */
import { ReportCsvAction, useReportCsvExport } from '@jetpack-premium-analytics/widgets-toolkit';
import { render, screen } from '@testing-library/react';
/**
 * Internal dependencies
 */
import { getAuthorName, useAuthorsReportRecords, type AuthorRow } from './config';
import AuthorsReportPage from './page';

jest.mock( './config', () => ( {
	getAuthorName: jest.fn( ( name: string ) =>
		name === 'Untracked Authors' ? 'Untracked authors' : name
	),
	getAuthorsFields: () => [],
	useAuthorsReportRecords: jest.fn(),
} ) );

jest.mock( '@jetpack-premium-analytics/routing', () => ( {
	useDashboardLink: () => '/',
	useReportDateFilters: () => ( {} ),
} ) );

jest.mock( '@jetpack-premium-analytics/ui', () => ( {
	...jest.requireActual( '@jetpack-premium-analytics/ui' ),
	DateFiltersPanel: () => null,
} ) );

jest.mock( '@jetpack-premium-analytics/widgets-toolkit', () => ( {
	...jest.requireActual( '@jetpack-premium-analytics/widgets-toolkit' ),
	ReportCsvAction: jest.fn( () => <button>Download</button> ),
	ReportDrilldownTable: jest.fn( () => null ),
	useReportCsvExport: jest.fn(),
} ) );

// `Breadcrumbs` reaches for router context this page-level test has no need to provide.
jest.mock( '@wordpress/admin-ui', () => ( {
	...jest.requireActual( '@wordpress/admin-ui' ),
	Breadcrumbs: () => null,
} ) );

jest.mock( '@wordpress/route', () => ( {
	...jest.requireActual( '@wordpress/route' ),
	useSearch: () => ( {} ),
} ) );

const useRecordsMock = jest.mocked( useAuthorsReportRecords );
const useReportCsvExportMock = jest.mocked( useReportCsvExport );
const reportCsvActionMock = jest.mocked( ReportCsvAction );
const getAuthorNameMock = jest.mocked( getAuthorName );

/**
 * Build a records-hook return value for the page under test.
 *
 * @param overrides - The fields to override on the successful-empty default.
 * @return The mocked hook result.
 */
function buildRecords( overrides: Partial< ReturnType< typeof useAuthorsReportRecords > > ) {
	return {
		rows: [],
		hasComparison: false,
		isLoading: false,
		isFetching: false,
		isError: false,
		refetch: jest.fn(),
		...overrides,
	} as ReturnType< typeof useAuthorsReportRecords >;
}

describe( 'AuthorsReportPage', () => {
	beforeEach( () => {
		jest.clearAllMocks();
		useReportCsvExportMock.mockReturnValue( {
			canExport: false,
			rows: [],
			filename: 'top-authors',
		} );
	} );

	it( 'surfaces the error and retry instead of stale rows', () => {
		useRecordsMock.mockReturnValue(
			buildRecords( {
				rows: [
					{
						id: 'id:42',
						label: 'Ada Lovelace',
						avatarUrl: null,
						isGroup: true,
						views: 12,
					},
				],
				isError: true,
			} )
		);

		render( <AuthorsReportPage /> );

		expect( screen.getByText( 'Unable to load authors' ) ).toBeInTheDocument();
		expect( screen.getByRole( 'button', { name: 'Retry' } ) ).toBeInTheDocument();
		expect( screen.queryByText( 'Ada Lovelace' ) ).not.toBeInTheDocument();
	} );

	it( 'exports displayed author names in their existing hierarchy order', () => {
		const rows: AuthorRow[] = [
			{
				id: 'id:42',
				label: 'Untracked Authors',
				avatarUrl: null,
				isGroup: true,
				views: 12,
			},
			{
				id: 'id:42|post:id:1',
				parentId: 'id:42',
				parentName: 'Untracked Authors',
				label: 'Analytical Engine',
				avatarUrl: null,
				views: 7,
				postId: '1',
			},
		];
		const records = buildRecords( { rows } );
		useRecordsMock.mockReturnValue( records );
		useReportCsvExportMock.mockReturnValue( {
			canExport: true,
			rows,
			filename: 'top-authors-2026-06-01_2026-06-30',
		} );

		render( <AuthorsReportPage /> );

		expect( screen.getByRole( 'button', { name: 'Download' } ) ).toBeInTheDocument();
		expect( useReportCsvExportMock ).toHaveBeenCalledWith(
			expect.objectContaining( {
				rows,
				filenamePrefix: 'top-authors',
				status: records,
			} )
		);
		expect( useReportCsvExportMock.mock.calls[ 0 ][ 0 ].sort ).toBeUndefined();

		const { columns, rows: exportRows } = reportCsvActionMock.mock.calls[ 0 ][ 0 ];
		expect( exportRows.map( row => columns.map( column => column.getValue( row ) ) ) ).toEqual( [
			[ 'Untracked authors', 12 ],
			[ 'Untracked authors > Analytical Engine', 7 ],
		] );
		expect( getAuthorNameMock ).toHaveBeenCalledWith( 'Untracked Authors' );
		expect( reportCsvActionMock.mock.calls[ 0 ][ 0 ] ).toEqual(
			expect.objectContaining( {
				rows,
				filename: 'top-authors-2026-06-01_2026-06-30',
			} )
		);
	} );
} );
