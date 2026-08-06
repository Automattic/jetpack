/**
 * External dependencies
 */
import {
	getDefaultQueryParams,
	GlobalErrorProvider,
	queryClient,
	type ReportParams,
} from '@jetpack-premium-analytics/data';
import { render, screen } from '@testing-library/react';
import apiFetch from '@wordpress/api-fetch';
import type { AnchorHTMLAttributes, ReactNode } from 'react';
/**
 * Internal dependencies
 */
import AnnualHighlightsWidget from '../render';
import type { AnnualHighlightMetric } from '../widget';

jest.mock( '@wordpress/api-fetch', () => jest.fn() );

type MockRouteLinkProps = {
	to: string;
	children: ReactNode;
} & Omit< AnchorHTMLAttributes< HTMLAnchorElement >, 'href' >;

// WidgetRoot reads URL search params as a fallback for report params; outside
// a matched route the real hook warns and throws.
jest.mock( '@wordpress/route', () => ( {
	Link: ( { to, children, ...props }: MockRouteLinkProps ) => (
		<a href={ to } { ...props }>
			{ children }
		</a>
	),
	useSearch: () => ( {} ),
} ) );

const mockApiFetch = apiFetch as unknown as jest.Mock;

const METRICS = [ 'posts', 'words', 'likes', 'comments' ] as const;

// Two years with distinct totals, so a wrong selection cannot pass by matching
// the other year's numbers or their sum.
const INSIGHTS_PAYLOAD = {
	highest_day_of_week: 6,
	highest_day_percent: 10,
	highest_hour: 11,
	highest_hour_percent: 5,
	years: [
		{
			year: '2025',
			total_posts: 12,
			total_words: 300,
			avg_words: 25,
			total_likes: 7,
			avg_likes: 0.6,
			total_comments: 4,
			avg_comments: 0.3,
			total_images: 2,
			avg_images: 0.2,
		},
		{
			year: '2026',
			total_posts: 30,
			total_words: 900,
			avg_words: 30,
			total_likes: 21,
			avg_likes: 0.7,
			total_comments: 9,
			avg_comments: 0.3,
			total_images: 5,
			avg_images: 0.2,
		},
	],
};

const renderWidget = (
	reportParams: Partial< ReportParams >,
	// `null` stands for an instance with no `metrics` attribute at all — passing
	// `undefined` would just trigger this default.
	metrics: AnnualHighlightMetric[] | null = [ ...METRICS ]
) =>
	render(
		<GlobalErrorProvider>
			<AnnualHighlightsWidget
				attributes={ {
					...( metrics ? { metrics } : {} ),
					reportParams: reportParams as ReportParams,
				} }
			/>
		</GlobalErrorProvider>
	);

/**
 * Renders the widget and waits for the insights request to resolve, so each
 * test can assert label + value per tile — a selection that lands on the wrong
 * period cannot pass by matching values loosely.
 *
 * @param reportParams - Report params standing in for the section's selection.
 * @return The render container.
 */
async function mountAndSettle( reportParams: Partial< ReportParams > ) {
	const { container } = renderWidget( reportParams );

	await expect( screen.findByText( 'Posts' ) ).resolves.toBeInTheDocument();

	return container;
}

describe( 'AnnualHighlightsWidget', () => {
	beforeEach( () => {
		queryClient.clear();
		mockApiFetch.mockReset();
		mockApiFetch.mockResolvedValue( INSIGHTS_PAYLOAD );
	} );

	it( 'shows the year the section selected', async () => {
		const container = await mountAndSettle( {
			preset: 'year-2025',
			from: '2025-01-01',
			to: '2025-12-31',
		} );

		expect( container ).toHaveTextContent( 'Posts12' );
		expect( container ).toHaveTextContent( 'Words300' );
		expect( container ).toHaveTextContent( 'Likes7' );
		expect( container ).toHaveTextContent( 'Comments4' );
	} );

	it( 'sums every year for the all-time selection', async () => {
		const container = await mountAndSettle( {
			preset: 'all-time',
			from: '2025-01-01',
			to: '2026-08-06',
		} );

		expect( container ).toHaveTextContent( 'Posts42' );
		// 1,200 words renders as `1K`: the shared count format shortens with no
		// decimals, the same as it does for a single year.
		expect( container ).toHaveTextContent( 'Words1K' );
		expect( container ).toHaveTextContent( 'Likes28' );
		expect( container ).toHaveTextContent( 'Comments13' );
	} );

	it( 'shows the most recent year when the section has no year selection', async () => {
		const container = await mountAndSettle( getDefaultQueryParams( false, 'last-7-days' ) );

		expect( container ).toHaveTextContent( 'Posts30' );
		expect( container ).toHaveTextContent( 'Words900' );
		expect( container ).toHaveTextContent( 'Likes21' );
		expect( container ).toHaveTextContent( 'Comments9' );
	} );

	it( 'shows every metric when the instance carries no metrics attribute', async () => {
		// The server's default layout creates the instance without attributes,
		// and the settings control reads the widget's own defaults — the body has
		// to agree with it rather than report that nothing is selected.
		const { container } = renderWidget( getDefaultQueryParams( false, 'last-7-days' ), null );

		await expect( screen.findByText( 'Posts' ) ).resolves.toBeInTheDocument();
		expect( container ).toHaveTextContent( 'Posts30' );
		expect( container ).toHaveTextContent( 'Words900' );
		expect( container ).toHaveTextContent( 'Likes21' );
		expect( container ).toHaveTextContent( 'Comments9' );
	} );

	it( 'still reports an empty selection when every metric is unchecked', async () => {
		renderWidget( getDefaultQueryParams( false, 'last-7-days' ), [] );

		await expect(
			screen.findByText( 'Select at least one metric to display.' )
		).resolves.toBeInTheDocument();
	} );

	it( 'shows the empty state for a year the site did not publish in', async () => {
		renderWidget( { preset: 'year-2019', from: '2019-01-01', to: '2019-12-31' } );

		await expect( screen.findByText( 'No highlights to show yet.' ) ).resolves.toBeInTheDocument();
	} );
} );
