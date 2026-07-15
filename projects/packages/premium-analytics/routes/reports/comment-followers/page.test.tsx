/**
 * External dependencies
 */
import { render, screen } from '@testing-library/react';
/**
 * Internal dependencies
 */
import { useCommentFollowersReportRecords } from './config';
import CommentFollowersReportPage from './page';

jest.mock( './config', () => ( {
	...jest.requireActual( './config' ),
	useCommentFollowersReportRecords: jest.fn(),
} ) );

jest.mock( '@jetpack-premium-analytics/routing', () => ( {
	useDashboardLink: () => '/',
} ) );

// `Breadcrumbs` reaches for router context this page-level test has no need to
// provide; the crumbs are not what these assertions cover.
jest.mock( '@wordpress/admin-ui', () => ( {
	...jest.requireActual( '@wordpress/admin-ui' ),
	Breadcrumbs: () => null,
} ) );

const useRecordsMock = jest.mocked( useCommentFollowersReportRecords );

/**
 * Build a records-hook return value for the page under test.
 *
 * @param overrides - The fields to override on the successful-empty default.
 * @return The mocked hook result.
 */
function buildRecords(
	overrides: Partial< ReturnType< typeof useCommentFollowersReportRecords > >
) {
	return {
		rows: [],
		allPostsFollowers: undefined,
		isLoading: false,
		isError: false,
		refetch: jest.fn(),
		...overrides,
	} as ReturnType< typeof useCommentFollowersReportRecords >;
}

describe( 'CommentFollowersReportPage', () => {
	it( 'surfaces the error and retry even while cached rows are still available', () => {
		// React Query keeps the last successful data when a background refetch
		// fails, so rows and an error state coexist. The error must still show.
		useRecordsMock.mockReturnValue(
			buildRecords( {
				rows: [ { id: 1, label: 'Hello world', followers: 12, value: 12, children: null } ],
				allPostsFollowers: 20,
				isError: true,
			} )
		);

		render( <CommentFollowersReportPage /> );

		expect( screen.getByText( 'Unable to load subscribers' ) ).toBeInTheDocument();
		expect( screen.getByRole( 'button', { name: 'Retry' } ) ).toBeInTheDocument();
		// The stale row must not stay on screen behind the error.
		expect( screen.queryByText( 'Hello world' ) ).not.toBeInTheDocument();
	} );

	it( 'shows the All Posts summary and rows on success', () => {
		useRecordsMock.mockReturnValue(
			buildRecords( {
				rows: [ { id: 1, label: 'Hello world', followers: 12, value: 12, children: null } ],
				allPostsFollowers: 20,
			} )
		);

		render( <CommentFollowersReportPage /> );

		expect( screen.getByText( 'All Posts' ) ).toBeInTheDocument();
		expect( screen.queryByText( 'Unable to load subscribers' ) ).not.toBeInTheDocument();
	} );
} );
