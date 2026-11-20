import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import OverviewStats, { getPercentChange } from '../stats-card/overview-stats';

jest.mock( '../../stats-section/stats-chart', () => ( { data } ) => (
	<div data-testid="chart">{ data[ 0 ]?.label }</div>
) );

const chartData = {
	fields: [ 'period', 'views', 'visitors', 'likes', 'comments' ],
	data: [ [ '2026-10-20', 10, 5, 2, 1 ] ],
};

describe( 'OverviewStats', () => {
	it( 'charts the metric of the selected tab', async () => {
		render(
			<OverviewStats
				counts={ { views: 10, visitors: 5, likes: 2, comments: 1 } }
				days={ 7 }
				chartData={ chartData }
				onDetailedStatsClick={ jest.fn() }
			/>
		);

		expect( screen.getByRole( 'button', { name: /Views/ } ) ).toHaveAttribute(
			'aria-pressed',
			'true'
		);
		expect( screen.getByTestId( 'chart' ) ).toHaveTextContent( 'Views' );

		await userEvent.click( screen.getByRole( 'button', { name: /Visitors/ } ) );

		expect( screen.getByRole( 'button', { name: /Visitors/ } ) ).toHaveAttribute(
			'aria-pressed',
			'true'
		);
		expect( screen.getByRole( 'button', { name: /Views/ } ) ).toHaveAttribute(
			'aria-pressed',
			'false'
		);
		expect( screen.getByTestId( 'chart' ) ).toHaveTextContent( 'Visitors' );
	} );

	it( 'shows no zero counts and no selected tab while loading', () => {
		render(
			<OverviewStats
				isLoading
				counts={ {} }
				days={ 7 }
				chartData={ null }
				onDetailedStatsClick={ jest.fn() }
			/>
		);

		expect( screen.queryByText( '0' ) ).not.toBeInTheDocument();
		expect( screen.queryByRole( 'button', { pressed: true } ) ).not.toBeInTheDocument();
	} );

	it.each( [
		[ 110, 'stable', '+10% compared to previous 7 days' ],
		[ 92, 'medium', '-8% compared to previous 7 days' ],
		[ 100, 'none', 'No change compared to previous 7 days' ],
	] )( 'labels a change to %d views from 100', ( views, intent, text ) => {
		render(
			<OverviewStats
				counts={ { views, visitors: 5, likes: 2, comments: 1 } }
				previousCounts={ { views: 100, visitors: 5, likes: 0, comments: 1 } }
				days={ 7 }
				chartData={ chartData }
				onDetailedStatsClick={ jest.fn() }
			/>
		);

		expect( screen.getByRole( 'button', { name: /Views/ } ) ).toHaveAccessibleDescription( text );
		expect( screen.getByText( text ).className ).toMatch( `__is-${ intent }-intent` );
	} );

	it( 'moves the badge with the selected tab and drops it with nothing to compare', async () => {
		render(
			<OverviewStats
				counts={ { views: 110, visitors: 6, likes: 2, comments: 1 } }
				previousCounts={ { views: 100, visitors: 3, likes: 0, comments: 1 } }
				days={ 30 }
				chartData={ chartData }
				onDetailedStatsClick={ jest.fn() }
			/>
		);

		await userEvent.click( screen.getByRole( 'button', { name: /Visitors/ } ) );
		expect( screen.getByRole( 'button', { name: /Visitors/ } ) ).toHaveAccessibleDescription(
			'+100% compared to previous 30 days'
		);
		expect( screen.getByRole( 'button', { name: /Views/ } ) ).not.toHaveAttribute(
			'aria-describedby'
		);

		await userEvent.click( screen.getByRole( 'button', { name: /Likes/ } ) );
		expect( screen.queryByText( /compared to previous/ ) ).not.toBeInTheDocument();
	} );

	it.each( [
		[ 1000, 999, 0 ],
		[ 999, 1000, 0 ],
		[ 5, 0, null ],
		[ 5, undefined, null ],
		[ undefined, 5, null ],
	] )( 'getPercentChange( %p, %p ) is %p', ( count, previous, expected ) => {
		expect( getPercentChange( count, previous ) ).toBe( expected );
	} );

	it( 'keeps Views selected when a tab is clicked while loading', async () => {
		const stats = ( isLoading: boolean ) => (
			<OverviewStats
				isLoading={ isLoading }
				counts={ { views: 10, visitors: 5, likes: 2, comments: 1 } }
				days={ 7 }
				chartData={ chartData }
				onDetailedStatsClick={ jest.fn() }
			/>
		);
		const { rerender } = render( stats( true ) );

		await userEvent.click( screen.getByRole( 'button', { name: /Visitors/ } ) );
		rerender( stats( false ) );

		expect( screen.getByRole( 'button', { name: /Views/ } ) ).toHaveAttribute(
			'aria-pressed',
			'true'
		);
	} );
} );
