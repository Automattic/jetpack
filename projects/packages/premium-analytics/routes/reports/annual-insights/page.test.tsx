/**
 * External dependencies
 */
import { useStatsInsights } from '@jetpack-premium-analytics/data';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
/**
 * Internal dependencies
 */
import { getNoticeText } from '../../../tests/js/notice-test-utils';
import AnnualInsightsReportPage from './page';
import type { StatsInsightsYear } from '@jetpack-premium-analytics/data';

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

const useStatsInsightsMock = jest.mocked( useStatsInsights );

const annualInsightRow: StatsInsightsYear = {
	year: '2026',
	total_posts: 12,
	total_comments: 20,
	avg_comments: 2,
	total_likes: 30,
	avg_likes: 3,
	total_words: 1200,
	avg_words: 100,
	total_images: 4,
	avg_images: 1,
};

describe( 'AnnualInsightsReportPage', () => {
	it( 'replaces stale rows with an error that refetches on Retry', async () => {
		const refetch = jest.fn();
		useStatsInsightsMock.mockReturnValue( {
			data: { years: [ annualInsightRow ] },
			isLoading: false,
			isFetching: false,
			isError: true,
			error: null,
			refetch,
		} as unknown as ReturnType< typeof useStatsInsights > );

		render( <AnnualInsightsReportPage /> );

		expect(
			getNoticeText( "We couldn't load annual insights. Please try again in a moment." )
		).toBeInTheDocument();
		expect( screen.queryByText( '2026' ) ).not.toBeInTheDocument();

		await userEvent.setup().click( screen.getByRole( 'button', { name: 'Retry' } ) );

		expect( refetch ).toHaveBeenCalledTimes( 1 );
	} );
} );
