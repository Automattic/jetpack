/**
 * External dependencies
 */
import {
	ExporterCsvAction,
	ReportDrilldownTable,
} from '@jetpack-premium-analytics/widgets-toolkit';
import { render, screen } from '@testing-library/react';
/**
 * Internal dependencies
 */
import { useAuthorsReportRecords } from './config';
import AuthorsReportPage from './page';
import type { AuthorRow } from '@jetpack-premium-analytics/widgets-toolkit';

jest.mock( './config', () => ( {
	getAuthorsFields: () => [],
	useAuthorsReportRecords: jest.fn(),
} ) );

jest.mock( '@jetpack-premium-analytics/routing', () => ( {
	...jest.requireActual( '@jetpack-premium-analytics/routing' ),
	useDashboardLink: () => '/',
	useReportDateFilters: () => ( {} ),
} ) );

jest.mock( '@jetpack-premium-analytics/ui', () => ( {
	...jest.requireActual( '@jetpack-premium-analytics/ui' ),
	DateFiltersPanel: () => null,
} ) );

jest.mock( '@jetpack-premium-analytics/widgets-toolkit', () => ( {
	...jest.requireActual( '@jetpack-premium-analytics/widgets-toolkit' ),
	ExporterCsvAction: jest.fn( () => <button>Download</button> ),
	ReportDrilldownTable: jest.fn( () => null ),
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
const exporterCsvActionMock = jest.mocked( ExporterCsvAction );
const reportDrilldownTableMock = jest.mocked( ReportDrilldownTable );

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
	} );

	it( 'opens folded to its top-level authors', () => {
		const rows: AuthorRow[] = [
			{
				id: 'id:42',
				label: 'Ada Lovelace',
				avatarUrl: null,
				isGroup: true,
				views: 12,
			},
		];
		useRecordsMock.mockReturnValue( buildRecords( { rows } ) );

		render( <AuthorsReportPage /> );

		expect( reportDrilldownTableMock.mock.calls[ 0 ][ 0 ] ).toEqual(
			expect.objectContaining( {
				data: rows,
				collapsible: true,
				defaultExpanded: 'none',
			} )
		);
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

	it( 'passes the report status to the page export action', () => {
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

		render( <AuthorsReportPage /> );

		expect( screen.getByRole( 'button', { name: 'Download' } ) ).toBeInTheDocument();
		expect( exporterCsvActionMock.mock.calls[ 0 ][ 0 ] ).toEqual(
			expect.objectContaining( { status: records } )
		);
	} );
} );
