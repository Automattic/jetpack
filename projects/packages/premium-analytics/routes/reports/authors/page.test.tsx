/**
 * External dependencies
 */
import { render, screen } from '@testing-library/react';
/**
 * Internal dependencies
 */
import { useAuthorsReportRecords } from './config';
import AuthorsReportPage from './page';

jest.mock( './config', () => ( {
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
		isError: false,
		refetch: jest.fn(),
		...overrides,
	} as ReturnType< typeof useAuthorsReportRecords >;
}

describe( 'AuthorsReportPage', () => {
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
} );
