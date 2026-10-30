/**
 * External dependencies
 */
import { GlobalChartsProvider } from '@jetpack-premium-analytics/externals';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
/**
 * Internal dependencies
 */
import { LeaderboardChart, type LeaderboardChartData } from '../leaderboard-chart';
import type { ComponentProps } from 'react';

const DATA: LeaderboardChartData = [
	{ id: 'seo', label: 'The Ultimate Guide to SEO', currentValue: 4186 },
	{ id: 'hello', label: 'Hello world!', currentValue: 734 },
];

const COMPACT = { type: 'number' as const, options: { useMultipliers: true, decimals: 0 } };

const renderChart = ( props: Partial< ComponentProps< typeof LeaderboardChart > > = {} ) =>
	render(
		<GlobalChartsProvider>
			<LeaderboardChart data={ DATA } dataFormat={ COMPACT } withOverlayLabel { ...props } />
		</GlobalChartsProvider>
	);

describe( 'LeaderboardChart', () => {
	beforeEach( () => {
		jest.useFakeTimers();
	} );

	afterEach( () => {
		jest.useRealTimers();
	} );

	it( 'names the rows and the metric above the values', () => {
		renderChart( { columns: { label: 'Pages', metric: 'views' } } );

		expect( screen.getByText( 'Pages' ) ).toBeInTheDocument();
		expect( screen.getByText( 'Views' ) ).toBeInTheDocument();
	} );

	it( 'restores an abbreviated value with its unit', async () => {
		const user = userEvent.setup( { advanceTimers: jest.advanceTimersByTime } );
		renderChart( { columns: { label: 'Pages', metric: 'views' } } );

		await user.hover( screen.getByText( '4.2K' ) );

		await expect(
			screen.findByRole( 'tooltip', undefined, { timeout: 3000 } )
		).resolves.toHaveTextContent( '4,186 views' );
	} );

	it.each( [
		[ 'clamps negative bars under an overlay label', true, 0 ],
		[ 'diverges negative bars beside a label', false, 3 ],
	] )( '%s', ( _, withOverlayLabel, divergingRows ) => {
		renderChart( {
			data: [ ...DATA, { id: 'refunds', label: 'Refunded', currentValue: -300 } ],
			withOverlayLabel,
		} );

		expect( screen.queryAllByTestId( 'leaderboard-chart-diverging-row' ) ).toHaveLength(
			divergingRows
		);
	} );

	it( 'draws no header without columns', () => {
		renderChart();

		expect( screen.queryByText( 'Views' ) ).not.toBeInTheDocument();
		expect( screen.getByText( '4,186' ) ).toBeInTheDocument();
	} );
} );
