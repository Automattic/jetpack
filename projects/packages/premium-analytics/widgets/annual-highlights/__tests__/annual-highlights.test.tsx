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
import userEvent, { PointerEventsCheckLevel } from '@testing-library/user-event';
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

// The widget defaults to the current year, so the payload is built relative to
// today — hardcoded years would silently move the default off the data after
// New Year. Distinct totals per year, so a wrong selection cannot pass by
// matching the other year's numbers. The package test script pins TZ=UTC,
// which is also what the widget's `siteTimeZone()` resolves to under jsdom's
// default WP date settings — so this year and the widget's agree.
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
	// `null` stands for an instance with no `metrics` attribute at all — passing
	// `undefined` would just trigger this default.
	metrics: AnnualHighlightMetric[] | null = [ ...METRICS ],
	reportParams: Partial< ReportParams > = getDefaultQueryParams( false, 'last-7-days' )
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
 * year cannot pass by matching values loosely.
 *
 * @return The render container.
 */
async function mountAndSettle() {
	const { container } = renderWidget();

	await expect( screen.findByText( 'Posts' ) ).resolves.toBeInTheDocument();

	return container;
}

/**
 * One configured instance for every pointer interaction, so the whole suite
 * shares the same pointer-events semantics. The check is off because jsdom
 * gives the popup no layout: its positioner never leaves the
 * `pointer-events: none` it opens with — a jsdom artifact, not a state a
 * browser user can see.
 */
function setupUser() {
	return userEvent.setup( { pointerEventsCheck: PointerEventsCheckLevel.Never } );
}

/**
 * Opens the widget's year dropdown and picks the previous year.
 */
async function selectPreviousYear() {
	const user = setupUser();

	await user.click( screen.getByRole( 'combobox', { name: 'Year' } ) );
	await user.click( screen.getByRole( 'option', { name: String( PREVIOUS_YEAR ), hidden: true } ) );
}

describe( 'AnnualHighlightsWidget', () => {
	beforeEach( () => {
		queryClient.clear();
		mockApiFetch.mockReset();
		mockApiFetch.mockResolvedValue( INSIGHTS_PAYLOAD );
	} );

	it( 'defaults to the current year', async () => {
		const container = await mountAndSettle();

		expect( container ).toHaveTextContent( 'Posts30' );
		expect( container ).toHaveTextContent( 'Words900' );
		expect( container ).toHaveTextContent( 'Likes21' );
		expect( container ).toHaveTextContent( 'Comments9' );
	} );

	it( 'switches every tile to the year picked in the dropdown', async () => {
		const container = await mountAndSettle();

		await selectPreviousYear();

		expect( container ).toHaveTextContent( 'Posts12' );
		expect( container ).toHaveTextContent( 'Words300' );
		expect( container ).toHaveTextContent( 'Likes7' );
		expect( container ).toHaveTextContent( 'Comments4' );
	} );

	it( 'switches without another insights request', async () => {
		await mountAndSettle();
		const requests = mockApiFetch.mock.calls.length;

		await selectPreviousYear();

		expect( mockApiFetch ).toHaveBeenCalledTimes( requests );
	} );

	it( 'ignores the section date selection', async () => {
		// The year shown belongs to the widget's own dropdown: a section still
		// carrying last year's preset must not move the tiles off the default.
		const { container } = renderWidget( [ ...METRICS ], {
			preset: `year-${ PREVIOUS_YEAR }`,
			from: `${ PREVIOUS_YEAR }-01-01`,
			to: `${ PREVIOUS_YEAR }-12-31`,
		} );

		await expect( screen.findByText( 'Posts' ) ).resolves.toBeInTheDocument();
		expect( container ).toHaveTextContent( 'Posts30' );
		expect( container ).toHaveTextContent( 'Words900' );
	} );

	it( 'survives a payload the sanitizer rejects, with no year dropdown to show', async () => {
		// The insights sanitizer returns a bare object for a shape it does not
		// recognize, so `years` is absent entirely.
		mockApiFetch.mockResolvedValue( {} );

		renderWidget();

		await expect(
			screen.findByText( 'No highlights for this year.' )
		).resolves.toBeInTheDocument();
		expect( screen.queryByRole( 'combobox', { name: 'Year' } ) ).not.toBeInTheDocument();
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

	it( 'keeps the year dropdown reachable from the empty state', async () => {
		mockApiFetch.mockResolvedValue( {
			...INSIGHTS_PAYLOAD,
			years: [ INSIGHTS_PAYLOAD.years[ 0 ] ],
		} );

		const { container } = renderWidget();

		await expect(
			screen.findByText( 'No highlights for this year.' )
		).resolves.toBeInTheDocument();

		await selectPreviousYear();

		expect( container ).toHaveTextContent( 'Posts12' );
	} );

	it( 'lists every year back to the oldest one in the payload', async () => {
		mockApiFetch.mockResolvedValue( {
			...INSIGHTS_PAYLOAD,
			years: [
				{ ...INSIGHTS_PAYLOAD.years[ 0 ], year: String( CURRENT_YEAR - 3 ) },
				INSIGHTS_PAYLOAD.years[ 1 ],
			],
		} );

		await mountAndSettle();

		await setupUser().click( screen.getByRole( 'combobox', { name: 'Year' } ) );
		const options = screen.getAllByRole( 'option', { hidden: true } );

		// Calendar years, newest first, publish gaps included — matching the
		// year filter surface the section used to provide.
		expect( options.map( option => option.textContent ) ).toEqual( [
			String( CURRENT_YEAR ),
			String( CURRENT_YEAR - 1 ),
			String( CURRENT_YEAR - 2 ),
			String( CURRENT_YEAR - 3 ),
		] );
	} );

	it( 'ignores a row with a garbled year instead of exploding the list', async () => {
		mockApiFetch.mockResolvedValue( {
			...INSIGHTS_PAYLOAD,
			// The sanitizer normalizes a missing year to '' — without the guard
			// this would resolve to year 0 and list two thousand entries.
			years: [ { ...INSIGHTS_PAYLOAD.years[ 0 ], year: '' }, INSIGHTS_PAYLOAD.years[ 1 ] ],
		} );

		await mountAndSettle();

		await setupUser().click( screen.getByRole( 'combobox', { name: 'Year' } ) );
		const options = screen.getAllByRole( 'option', { hidden: true } );

		expect( options.map( option => option.textContent ) ).toEqual( [ String( CURRENT_YEAR ) ] );
	} );

	it( 'shows every metric when the instance carries no metrics attribute', async () => {
		// The server's default layout creates the instance without attributes,
		// and the settings control reads the widget's own defaults — the body has
		// to agree with it rather than report that nothing is selected.
		const { container } = renderWidget( null );

		await expect( screen.findByText( 'Posts' ) ).resolves.toBeInTheDocument();
		expect( container ).toHaveTextContent( 'Posts30' );
		expect( container ).toHaveTextContent( 'Words900' );
		expect( container ).toHaveTextContent( 'Likes21' );
		expect( container ).toHaveTextContent( 'Comments9' );
	} );

	it( 'still reports an empty selection when every metric is unchecked', async () => {
		renderWidget( [] );

		await expect(
			screen.findByText( 'Select at least one metric to display.' )
		).resolves.toBeInTheDocument();
	} );
} );
