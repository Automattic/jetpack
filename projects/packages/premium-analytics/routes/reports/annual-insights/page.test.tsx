/**
 * External dependencies
 */
import { render, screen } from '@testing-library/react';
/**
 * Internal dependencies
 */
import { useAnnualInsightsReportRecords } from './config';
import AnnualInsightsReportPage from './page';
import type { StatsInsightsYear } from '@jetpack-premium-analytics/data';

jest.mock( './config', () => ( {
	...jest.requireActual( './config' ),
	useAnnualInsightsReportRecords: jest.fn(),
} ) );

jest.mock( '@jetpack-premium-analytics/routing', () => ( {
	useDashboardLink: () => '/',
} ) );

// `Breadcrumbs` reaches for router context this page-level test has no need to provide.
jest.mock( '@wordpress/admin-ui', () => ( {
	...jest.requireActual( '@wordpress/admin-ui' ),
	Breadcrumbs: () => null,
} ) );

const useRecordsMock = jest.mocked( useAnnualInsightsReportRecords );

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

/**
 * Build a records-hook return value for the page under test.
 *
 * @param overrides - The fields to override on the successful-empty default.
 * @return The mocked hook result.
 */
function buildRecords( overrides: Partial< ReturnType< typeof useAnnualInsightsReportRecords > > ) {
	return {
		rows: [],
		isLoading: false,
		isError: false,
		refetch: jest.fn(),
		...overrides,
	} as ReturnType< typeof useAnnualInsightsReportRecords >;
}

describe( 'AnnualInsightsReportPage', () => {
	it( 'surfaces the error and retry instead of stale rows', () => {
		useRecordsMock.mockReturnValue(
			buildRecords( {
				rows: [ annualInsightRow ],
				isError: true,
			} )
		);

		render( <AnnualInsightsReportPage /> );

		expect( screen.getByText( 'Unable to load annual insights' ) ).toBeInTheDocument();
		expect( screen.getByRole( 'button', { name: 'Retry' } ) ).toBeInTheDocument();
		expect( screen.queryByText( '2026' ) ).not.toBeInTheDocument();
	} );
} );
