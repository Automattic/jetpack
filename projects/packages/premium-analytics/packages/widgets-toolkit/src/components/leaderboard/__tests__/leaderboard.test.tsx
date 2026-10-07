/**
 * External dependencies
 */
import { GlobalChartsProvider } from '@jetpack-premium-analytics/externals';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
/**
 * Internal dependencies
 */
import { setMockRouteSearch } from '../../../../../../tests/js/route-test-utils';
import { WIDGET_ROW_LIMIT } from '../../../constants/rows';
import { describeError } from '../../../helpers/describe-error';
import { WidgetRootContext, type WidgetRootContextValue } from '../../widget-root';
import { Leaderboard, type LeaderboardStatus } from '../leaderboard';
import type { LeaderboardRowInput } from '../build-leaderboard-chart-data';
import type { ReactNode } from 'react';

jest.mock( '@wordpress/route', () => {
	const { mockWordPressRoute } = jest.requireActual(
		'../../../../../../tests/js/route-test-utils'
	);

	return mockWordPressRoute;
} );

const REPORT_PARAMS = {
	from: '2026-06-01',
	to: '2026-06-16',
	interval: 'day' as const,
	date_type: 'created' as const,
};

const READY: LeaderboardStatus = { isLoading: false, isError: false };

const ROWS = [
	{ id: '1', label: 'Getting Started', value: 3820, previousValue: 3000 },
	{ id: '2', label: 'Product Launch', value: 2640, previousValue: 2700 },
];

const WIDGET_ROOT = { reportParams: REPORT_PARAMS } as unknown as WidgetRootContextValue;

const Providers = ( { children }: { children: ReactNode } ) => (
	<WidgetRootContext.Provider value={ WIDGET_ROOT }>
		<GlobalChartsProvider>{ children }</GlobalChartsProvider>
	</WidgetRootContext.Provider>
);

const renderLeaderboard = ( ui: ReactNode ) => render( ui, { wrapper: Providers } );

describe( 'Leaderboard', () => {
	beforeEach( () => {
		setMockRouteSearch();
	} );

	it( 'renders the rows with their values', () => {
		renderLeaderboard( <Leaderboard rows={ ROWS } status={ READY } /> );

		expect( screen.getByText( 'Getting Started' ) ).toBeInTheDocument();
		expect( screen.getByText( 'Product Launch' ) ).toBeInTheDocument();
		expect( screen.getByText( '3.8K' ) ).toBeInTheDocument();
	} );

	it( 'links detail rows with the dashboard window unless a row declares its own', () => {
		renderLeaderboard(
			<Leaderboard
				rows={ [
					{ id: '1', label: 'Walkthrough', value: 10, action: { kind: 'videoLink', id: 101 } },
					{ id: '2', label: 'Hello world', value: 5, action: { kind: 'postLink', id: 9 } },
					{
						id: '3',
						label: 'Own window',
						value: 1,
						action: { kind: 'postLink', id: 3, search: {} },
					},
				] }
				status={ READY }
			/>
		);

		const dashboardWindow = 'from=2026-06-01&to=2026-06-16&interval=day&date_type=created';
		expect( screen.getByRole( 'link', { name: 'Walkthrough' } ) ).toHaveAttribute(
			'href',
			`/video/101?${ dashboardWindow }`
		);
		expect( screen.getByRole( 'link', { name: 'Hello world' } ) ).toHaveAttribute(
			'href',
			`/post/9?${ dashboardWindow }`
		);
		expect( screen.getByRole( 'link', { name: 'Own window' } ) ).toHaveAttribute(
			'href',
			'/post/3'
		);
	} );

	it( 'shows a skeleton row per row limit instead of the rows while loading', () => {
		renderLeaderboard( <Leaderboard rows={ ROWS } status={ { isLoading: true } } /> );

		expect( screen.queryByText( 'Getting Started' ) ).not.toBeInTheDocument();
		expect( screen.getAllByTestId( 'skeleton-row' ) ).toHaveLength( WIDGET_ROW_LIMIT );
	} );

	it( 'offers the generic error with a retry when the widget passes none', async () => {
		const refetch = jest.fn();
		renderLeaderboard(
			<Leaderboard rows={ [] } status={ { isLoading: false, isError: true, refetch } } />
		);

		expect( screen.getByRole( 'alert' ) ).toHaveTextContent( "We couldn't load this data." );
		await userEvent.click( screen.getByRole( 'button', { name: 'Retry' } ) );
		expect( refetch ).toHaveBeenCalledTimes( 1 );
	} );

	it( 'adds no retry to an access-denied error from describeError()', () => {
		const refetch = jest.fn();
		renderLeaderboard(
			<Leaderboard
				rows={ [] }
				status={ { isLoading: false, isError: true, refetch } }
				error={ describeError(
					{ status: 403 },
					{ retryDescription: 'Could not load videos.', onRetry: refetch }
				) }
			/>
		);

		expect( screen.getByRole( 'alert' ) ).toHaveTextContent(
			"You don't have access to this data."
		);
		expect( screen.queryByRole( 'button', { name: 'Retry' } ) ).not.toBeInTheDocument();
	} );

	it( 'shows the generic empty state without rows', () => {
		renderLeaderboard( <Leaderboard rows={ [] } status={ READY } /> );

		expect(
			screen.getByText( 'We couldn’t find results for this time period.' )
		).toBeInTheDocument();
	} );

	it( 'drills into a row with children and back, labelling the way', async () => {
		const rows = [
			{
				id: 'google',
				label: 'Google',
				value: 10,
				children: [
					{
						id: 'images',
						label: 'Images',
						value: 4,
						children: [ { id: 'x', label: 'Deep row', value: 1 } ],
					},
				],
			},
			{ id: 'direct', label: 'Direct', value: 5 },
		];
		renderLeaderboard(
			<Leaderboard
				rows={ rows }
				status={ READY }
				drillDown={ {
					backLabel: 'All referrers',
					backAriaLabel: 'View all referrers',
					rowAriaLabel: row => `View ${ row.label }`,
				} }
			/>
		);

		expect(
			screen.queryByRole( 'button', { name: 'View all referrers' } )
		).not.toBeInTheDocument();
		await userEvent.click( screen.getByRole( 'button', { name: 'View Google' } ) );

		expect( screen.getByText( 'Images' ) ).toBeInTheDocument();
		expect( screen.queryByText( 'Direct' ) ).not.toBeInTheDocument();

		await userEvent.click( screen.getByRole( 'button', { name: 'View Images' } ) );

		expect( screen.getByText( 'Deep row' ) ).toBeInTheDocument();
		await userEvent.click( screen.getByRole( 'button', { name: 'Back to Google' } ) );

		expect( screen.getByText( 'Images' ) ).toBeInTheDocument();
		await userEvent.click( screen.getByRole( 'button', { name: 'View all referrers' } ) );

		expect( screen.getByText( 'Direct' ) ).toBeInTheDocument();
	} );

	describe( 'when the drilled row leaves the data', () => {
		const WITH_CHILDREN = [
			{
				id: 'google',
				label: 'Google',
				value: 10,
				children: [ { id: 'c', label: 'Child', value: 1 } ],
			},
		];
		const WITHOUT_CHILDREN = [ { id: 'direct', label: 'Direct', value: 5 } ];
		const DRILL_DOWN = {
			backLabel: 'All',
			rowAriaLabel: ( row: { label: string } ) => `View ${ row.label }`,
		};

		// The row comes back afterwards, so a selection still held would reopen it.
		async function drillInThenLoseTheRow( interimStatus: LeaderboardStatus ) {
			const { rerender } = renderLeaderboard(
				<Leaderboard rows={ WITH_CHILDREN } status={ READY } drillDown={ DRILL_DOWN } />
			);
			await userEvent.click( screen.getByRole( 'button', { name: 'View Google' } ) );
			expect( screen.getByText( 'Child' ) ).toBeInTheDocument();

			const rerenderWith = ( rows: LeaderboardRowInput[], status: LeaderboardStatus ) =>
				rerender( <Leaderboard rows={ rows } status={ status } drillDown={ DRILL_DOWN } /> );
			rerenderWith( WITHOUT_CHILDREN, interimStatus );
			rerenderWith( WITH_CHILDREN, READY );
		}

		it( 'drops a selection the settled data no longer backs', async () => {
			await drillInThenLoseTheRow( READY );

			expect( screen.getByRole( 'button', { name: 'View Google' } ) ).toBeInTheDocument();
			expect( screen.queryByText( 'Child' ) ).not.toBeInTheDocument();
		} );

		it( 'keeps the selection through a refetch that briefly drops the row', async () => {
			await drillInThenLoseTheRow( { isLoading: false, isFetching: true } );

			expect( screen.getByText( 'Child' ) ).toBeInTheDocument();
		} );
	} );

	it( 'renders the footer in every state', () => {
		renderLeaderboard(
			<Leaderboard
				rows={ [] }
				status={ { isLoading: true } }
				footer={ <a href="/all">View all</a> }
			/>
		);

		expect( screen.getByRole( 'link', { name: 'View all' } ) ).toBeInTheDocument();
	} );
} );
