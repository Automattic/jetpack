/**
 * External dependencies
 */
import { useStatsEmailSummary } from '@jetpack-premium-analytics/data';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
/**
 * Internal dependencies
 */
import { getNoticeText } from '../../../tests/js/notice-test-utils';
import EmailsReportPage from './page';
import type { StatsEmailSummaryItem } from '@jetpack-premium-analytics/data';

jest.mock( '@jetpack-premium-analytics/data', () => ( {
	...jest.requireActual( '@jetpack-premium-analytics/data' ),
	useStatsArchives: jest.fn(),
	useStatsClicks: jest.fn(),
	useStatsCommentFollowersAllPages: jest.fn(),
	useStatsComments: jest.fn(),
	useStatsEmailSummary: jest.fn(),
	useStatsFileDownloads: jest.fn(),
	useStatsInsights: jest.fn(),
	useStatsLocations: jest.fn(),
	useStatsReferrers: jest.fn(),
	useStatsSearchTerms: jest.fn(),
	useStatsTags: jest.fn(),
	useStatsTopAuthors: jest.fn(),
	useStatsTopPosts: jest.fn(),
	useStatsUtm: jest.fn(),
	useStatsVideoPlays: jest.fn(),
} ) );

// Report pages render tabs without panels, which trips the tabs' dev-only count check.
jest.mock( '@jetpack-premium-analytics/widgets-toolkit', () => ( {
	...jest.requireActual( '@jetpack-premium-analytics/widgets-toolkit' ),
	ReportPageTabs: () => null,
} ) );

jest.mock( '@wordpress/route', () => {
	const { mockWordPressRoute } = jest.requireActual( '../../../tests/js/route-test-utils' );

	return mockWordPressRoute;
} );

const useStatsEmailSummaryMock = jest.mocked( useStatsEmailSummary );

const email: StatsEmailSummaryItem = {
	id: 91,
	label: 'Hello world',
	value: 120,
	date: '2026-07-10',
	opens: 120,
	clicks: 14,
	opens_rate: 38.1,
	clicks_rate: 3.81,
	unique_opens: 98,
	unique_clicks: 11,
	total_sends: 250,
	children: null,
};

/**
 * Serve a one-email summary through the mocked data hook.
 *
 * @param isError - Whether the request failed.
 * @return The mocked refetch.
 */
function mockEmailSummary( isError = false ) {
	const refetch = jest.fn();
	useStatsEmailSummaryMock.mockReturnValue( {
		data: { data: [ { items: [ email ] } ] },
		isLoading: false,
		isFetching: false,
		isError,
		error: null,
		refetch,
	} as unknown as ReturnType< typeof useStatsEmailSummary > );

	return refetch;
}

describe( 'EmailsReportPage', () => {
	it( 'renders the summary rows with their 0–100 open rate as a percentage', () => {
		mockEmailSummary();

		render( <EmailsReportPage /> );

		expect( screen.getByText( 'Hello world' ) ).toBeInTheDocument();
		expect( screen.getByText( '38.1%' ) ).toBeInTheDocument();
	} );

	it( 'replaces the table with an error that refetches on Retry', async () => {
		const refetch = mockEmailSummary( true );

		render( <EmailsReportPage /> );

		expect(
			getNoticeText( "We couldn't load emails. Please try again in a moment." )
		).toBeInTheDocument();
		expect( screen.queryByText( 'Hello world' ) ).not.toBeInTheDocument();

		await userEvent.setup().click( screen.getByRole( 'button', { name: 'Retry' } ) );

		expect( refetch ).toHaveBeenCalledTimes( 1 );
	} );
} );
