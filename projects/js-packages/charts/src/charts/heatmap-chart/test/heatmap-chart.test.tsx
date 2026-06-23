import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { GlobalChartsProvider } from '../../../providers';
import HeatmapChart from '../heatmap-chart';
import type { HeatmapColumn } from '../types';

const mockRefCallback = jest.fn();
jest.mock( '../../../hooks/use-element-size', () => ( {
	useElementSize: () => [ mockRefCallback, 500, 300 ],
} ) );

const data: HeatmapColumn[] = [
	{ label: 'W1', data: [ { value: 1 }, { value: 2 }, { value: null } ] },
	{ label: 'W2', data: [ { value: 3 }, { value: 0 }, { value: 4 } ] },
];

const renderChart = ( props = {} ) =>
	render(
		<GlobalChartsProvider>
			<HeatmapChart width={ 500 } height={ 300 } data={ data } { ...props } />
		</GlobalChartsProvider>
	);

describe( 'HeatmapChart', () => {
	test( 'renders a grid with an accessible label', () => {
		renderChart();
		expect( screen.getByRole( 'grid', { name: /heatmap/i } ) ).toBeInTheDocument();
	} );

	test( 'renders one rect per cell', () => {
		renderChart();
		// 2 columns x 3 rows = 6 cells
		expect( screen.getAllByTestId( 'heatmap-cell' ) ).toHaveLength( 6 );
	} );

	test( 'shows an empty-state message for empty data', () => {
		renderChart( { data: [] } );
		expect( screen.getByText( /no data available/i ) ).toBeInTheDocument();
	} );

	test( 'renders column and row labels', () => {
		renderChart( { rowLabels: [ 'Mon', '', 'Wed' ] } );
		expect( screen.getAllByText( 'W1' ).length ).toBeGreaterThan( 0 );
		expect( screen.getAllByText( 'Mon' ).length ).toBeGreaterThan( 0 );
		expect( screen.getAllByText( 'Wed' ).length ).toBeGreaterThan( 0 );
	} );

	test( 'shows in-cell values by default and hides them in compact mode', () => {
		const { rerender } = renderChart();
		// value 3 appears in a cell
		expect( screen.getAllByText( '3' ).length ).toBeGreaterThan( 0 );

		rerender(
			<GlobalChartsProvider>
				<HeatmapChart width={ 500 } height={ 300 } data={ data } compact />
			</GlobalChartsProvider>
		);
		expect( screen.queryByText( '3' ) ).not.toBeInTheDocument();
	} );

	/* eslint-disable testing-library/no-node-access */
	test( 'renders an accessible title per cell for screen readers', () => {
		renderChart( { rowLabels: [ 'Mon', 'Tue', 'Wed' ] } );
		const grid = screen.getByRole( 'grid', { name: /heatmap/i } );
		const titles = Array.from( grid.querySelectorAll( 'title' ) ).map( t => t.textContent );
		expect( titles.some( t => t?.includes( 'W1' ) && t?.includes( 'Mon' ) ) ).toBe( true );
	} );

	test( 'shows a tooltip on cell hover when withTooltips is set', async () => {
		renderChart( { withTooltips: true, rowLabels: [ 'Mon', 'Tue', 'Wed' ] } );
		const cell = screen.getAllByTestId( 'heatmap-cell' )[ 0 ];
		await userEvent.setup().hover( cell );
		await expect( screen.findByRole( 'tooltip' ) ).resolves.toBeInTheDocument();
	} );
	/* eslint-enable testing-library/no-node-access */

	test( 'renders a composition legend with Less/More labels', () => {
		render(
			<GlobalChartsProvider>
				<HeatmapChart width={ 500 } height={ 300 } data={ data }>
					<HeatmapChart.Legend />
				</HeatmapChart>
			</GlobalChartsProvider>
		);
		expect( screen.getByText( /less/i ) ).toBeInTheDocument();
		expect( screen.getByText( /more/i ) ).toBeInTheDocument();
	} );
} );
