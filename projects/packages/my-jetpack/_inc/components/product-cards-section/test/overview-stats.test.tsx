import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import OverviewStats from '../stats-card/overview-stats';

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
				chartData={ null }
				onDetailedStatsClick={ jest.fn() }
			/>
		);

		expect( screen.queryByText( '0' ) ).not.toBeInTheDocument();
		expect( screen.queryByRole( 'button', { pressed: true } ) ).not.toBeInTheDocument();
	} );

	it( 'keeps Views selected when a tab is clicked while loading', async () => {
		const stats = ( isLoading: boolean ) => (
			<OverviewStats
				isLoading={ isLoading }
				counts={ { views: 10, visitors: 5, likes: 2, comments: 1 } }
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
