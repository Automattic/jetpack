/**
 * External dependencies
 */
import { render, screen } from '@testing-library/react';
/**
 * Internal dependencies
 */
import { useCommentsReportRecords } from './config';
import CommentsReportPage from './page';

jest.mock( './config', () => ( {
	getCommentsFields: () => [
		{
			id: 'label',
			label: 'Name',
			getValue: ( { item }: { item: { label: string } } ) => item.label,
		},
		{
			id: 'comments',
			label: 'Comments',
			getValue: ( { item }: { item: { value: number } } ) => item.value,
		},
	],
	getCommentsReportTabs: () => [ { id: 'authors', label: 'Authors' } ],
	resolveTabId: ( value: string | undefined ) => value ?? 'authors',
	useCommentsReportRecords: jest.fn(),
} ) );

jest.mock( '@jetpack-premium-analytics/routing', () => ( {
	useDashboardLink: () => '/',
	useSectionTab: () => [ 'authors', jest.fn() ],
} ) );

// `Breadcrumbs` reaches for router context this page-level test has no need to provide.
jest.mock( '@wordpress/admin-ui', () => ( {
	...jest.requireActual( '@wordpress/admin-ui' ),
	Breadcrumbs: () => null,
} ) );

const useRecordsMock = jest.mocked( useCommentsReportRecords );

/**
 * Build a records-hook return value for the page under test.
 *
 * @param overrides - The fields to override on the successful-empty default.
 * @return The mocked hook result.
 */
function buildRecords( overrides: Partial< ReturnType< typeof useCommentsReportRecords > > ) {
	return {
		rows: [],
		isLoading: false,
		isError: false,
		refetch: jest.fn(),
		...overrides,
	} as ReturnType< typeof useCommentsReportRecords >;
}

describe( 'CommentsReportPage', () => {
	it( 'surfaces the error and retry instead of stale rows', () => {
		useRecordsMock.mockReturnValue(
			buildRecords( {
				rows: [ { id: 'author-hello', label: 'Hello world', value: 12 } ],
				isError: true,
			} )
		);

		render( <CommentsReportPage /> );

		expect( screen.getByText( 'Unable to load comments' ) ).toBeInTheDocument();
		expect( screen.getByRole( 'button', { name: 'Retry' } ) ).toBeInTheDocument();
		expect( screen.queryByText( 'Hello world' ) ).not.toBeInTheDocument();
	} );
} );
