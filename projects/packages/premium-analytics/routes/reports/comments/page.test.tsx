/**
 * External dependencies
 */
import { useStatsComments } from '@jetpack-premium-analytics/data';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
/**
 * Internal dependencies
 */
import { getNoticeText } from '../../../tests/js/notice-test-utils';
import CommentsReportPage from './page';
import type { StatsCommentsResponse } from '@jetpack-premium-analytics/data';

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

const useStatsCommentsMock = jest.mocked( useStatsComments );

const report: StatsCommentsResponse = {
	summary: {},
	data: [
		{
			time_interval: '2026-07-01',
			date_start: '2026-07-01T00:00:00+00:00',
			date_end: '2026-07-01T23:59:59+00:00',
			items: [
				{
					label: 'authors',
					value: 12,
					children: [
						{
							label: 'Hello world',
							value: 12,
							iconClassName: 'avatar-user',
							icon: null,
							link: null,
							actions: [],
							children: null,
						},
					],
				},
			],
		},
	],
};

describe( 'CommentsReportPage', () => {
	it( 'replaces stale rows with an error that refetches on Retry', async () => {
		const refetch = jest.fn();
		useStatsCommentsMock.mockReturnValue( {
			data: report,
			isLoading: false,
			isFetching: false,
			isError: true,
			error: null,
			refetch,
		} as unknown as ReturnType< typeof useStatsComments > );

		render( <CommentsReportPage /> );

		expect(
			getNoticeText( "We couldn't load comments. Please try again in a moment." )
		).toBeInTheDocument();
		expect( screen.queryByText( 'Hello world' ) ).not.toBeInTheDocument();

		await userEvent.setup().click( screen.getByRole( 'button', { name: 'Retry' } ) );

		expect( refetch ).toHaveBeenCalledTimes( 1 );
	} );
} );
