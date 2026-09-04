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
import type { YearPresetId } from '@jetpack-premium-analytics/datetime';

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

// Built relative to today: hardcoded years would silently move the no-attribute
// default off the data after New Year. The package test script pins TZ=UTC, which
// is what the widget's `reportingTimeZone()` also resolves to under jsdom.
const CURRENT_YEAR = new Date().getFullYear();
const PREVIOUS_YEAR = CURRENT_YEAR - 1;

const INSIGHTS_PAYLOAD = {
	highest_day_of_week: 6,
	highest_day_percent: 10,
	highest_hour: 11,
	highest_hour_percent: 5,
	years: [
		{
			year: String( PREVIOUS_YEAR ),
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
			year: String( CURRENT_YEAR ),
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
	year?: YearPresetId,
	reportParams: Partial< ReportParams > = getDefaultQueryParams( false, 'last-7-days' )
) =>
	render(
		<GlobalErrorProvider>
			<AnnualHighlightsWidget
				attributes={ {
					...( year ? { year } : {} ),
					reportParams: reportParams as ReportParams,
				} }
			/>
		</GlobalErrorProvider>
	);

describe( 'AnnualHighlightsWidget', () => {
	beforeEach( () => {
		queryClient.clear();
		mockApiFetch.mockReset();
		mockApiFetch.mockResolvedValue( INSIGHTS_PAYLOAD );
	} );

	it( 'defaults to the current year when the instance carries no year', async () => {
		// The default layout creates the instance without attributes, and the host's
		// dropdown selects the current year — the body has to agree with it.
		const { container } = renderWidget();

		await expect( screen.findByText( 'Posts' ) ).resolves.toBeInTheDocument();
		expect( container ).toHaveTextContent( 'Posts30' );
		expect( container ).toHaveTextContent( 'Words900' );
		expect( container ).toHaveTextContent( 'Likes21' );
		expect( container ).toHaveTextContent( 'Comments9' );
	} );

	it( 'shows every tile for the year the attribute names', async () => {
		const { container } = renderWidget( `year-${ PREVIOUS_YEAR }` );

		await expect( screen.findByText( 'Posts' ) ).resolves.toBeInTheDocument();
		expect( container ).toHaveTextContent( 'Posts12' );
		expect( container ).toHaveTextContent( 'Words300' );
		expect( container ).toHaveTextContent( 'Likes7' );
		expect( container ).toHaveTextContent( 'Comments4' );
	} );

	it( 'ignores the section date selection', async () => {
		// The year shown belongs to the widget's own attribute: a section still
		// carrying last year's preset must not move the tiles off the default.
		const { container } = renderWidget( undefined, {
			preset: `year-${ PREVIOUS_YEAR }`,
			from: `${ PREVIOUS_YEAR }-01-01`,
			to: `${ PREVIOUS_YEAR }-12-31`,
		} );

		await expect( screen.findByText( 'Posts' ) ).resolves.toBeInTheDocument();
		expect( container ).toHaveTextContent( 'Posts30' );
		expect( container ).toHaveTextContent( 'Words900' );
	} );

	it( 'shows the empty state for a year the site did not publish in', async () => {
		mockApiFetch.mockResolvedValue( {
			...INSIGHTS_PAYLOAD,
			// Only last year has a row, so the current-year default has none.
			years: [ INSIGHTS_PAYLOAD.years[ 0 ] ],
		} );

		renderWidget();

		await expect(
			screen.findByText( 'No highlights for this year.' )
		).resolves.toBeInTheDocument();
	} );

	it( 'links to the Annual insights report', async () => {
		renderWidget();

		await expect( screen.findByText( 'Posts' ) ).resolves.toBeInTheDocument();
		expect( screen.getByRole( 'link', { name: 'View all' } ) ).toBeInTheDocument();
	} );

	it( 'keeps the report link in the empty state', async () => {
		// The footer sits outside `WidgetState`, so a year with no row must still
		// offer the only route to the full report.
		mockApiFetch.mockResolvedValue( {
			...INSIGHTS_PAYLOAD,
			years: [ INSIGHTS_PAYLOAD.years[ 0 ] ],
		} );

		renderWidget();

		await expect(
			screen.findByText( 'No highlights for this year.' )
		).resolves.toBeInTheDocument();
		expect( screen.getByRole( 'link', { name: 'View all' } ) ).toBeInTheDocument();
	} );

	it( 'survives a payload the sanitizer rejects', async () => {
		// The insights sanitizer returns a bare object for a shape it does not
		// recognize, so `years` is absent entirely.
		mockApiFetch.mockResolvedValue( {} );

		renderWidget();

		await expect(
			screen.findByText( 'No highlights for this year.' )
		).resolves.toBeInTheDocument();
	} );
} );
