import { render, screen } from '@testing-library/react';
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
} );
