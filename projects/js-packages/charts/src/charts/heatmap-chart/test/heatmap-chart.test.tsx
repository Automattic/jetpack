import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { GlobalChartsProvider } from '../../../providers';
import HeatmapChart, { HeatmapChartUnresponsive } from '../heatmap-chart';
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

	test( 'renders one cell per data point', () => {
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

	test( 'formats large in-cell values compactly', () => {
		render(
			<GlobalChartsProvider>
				<HeatmapChart
					width={ 500 }
					height={ 300 }
					data={ [ { label: 'W1', data: [ { value: 748500 } ] } ] }
				/>
			</GlobalChartsProvider>
		);
		expect( screen.getByText( /748\.5\s?K/i ) ).toBeInTheDocument();
	} );

	test( 'gives each cell an accessible name for screen readers', () => {
		renderChart( { rowLabels: [ 'Mon', 'Tue', 'Wed' ] } );
		// The gridcell's accessible name is its aria-label (column + row + value).
		expect( screen.getByRole( 'gridcell', { name: 'W1 Mon: 1' } ) ).toBeInTheDocument();
	} );

	test( 'shows a tooltip on cell hover when withTooltips is set', async () => {
		renderChart( { withTooltips: true, rowLabels: [ 'Mon', 'Tue', 'Wed' ] } );
		const cell = screen.getAllByTestId( 'heatmap-cell' )[ 0 ];
		await userEvent.setup().hover( cell );
		await expect( screen.findByRole( 'tooltip' ) ).resolves.toBeInTheDocument();
	} );

	test( 'shows a tooltip on keyboard navigation when withTooltips is set', async () => {
		renderChart( { withTooltips: true, rowLabels: [ 'Mon', 'Tue', 'Wed' ] } );
		const grid = screen.getByRole( 'grid', { name: /heatmap/i } );
		grid.focus();
		await userEvent.setup().keyboard( '{ArrowDown}' );
		await expect( screen.findByRole( 'tooltip' ) ).resolves.toBeInTheDocument();
	} );

	test( 'hides the keyboard tooltip on Escape', async () => {
		renderChart( { withTooltips: true, rowLabels: [ 'Mon', 'Tue', 'Wed' ] } );
		const grid = screen.getByRole( 'grid', { name: /heatmap/i } );
		const user = userEvent.setup();
		grid.focus();
		await user.keyboard( '{ArrowDown}' );
		await expect( screen.findByRole( 'tooltip' ) ).resolves.toBeInTheDocument();
		await user.keyboard( '{Escape}' );
		expect( screen.queryByRole( 'tooltip' ) ).not.toBeInTheDocument();
	} );

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

	test( 'ArrowDown moves focus within a column, ArrowRight moves to next column', async () => {
		renderChart( { rowLabels: [ 'Mon', 'Tue', 'Wed' ] } );
		const grid = screen.getByRole( 'grid', { name: /heatmap/i } );
		const user = userEvent.setup();

		// First ArrowDown lands on cell (0,0)
		grid.focus();
		await user.keyboard( '{ArrowDown}' );
		expect( grid ).toHaveAttribute(
			'aria-activedescendant',
			expect.stringMatching( /-cell-0-0$/ )
		);

		// Second ArrowDown moves row 0→1 in col 0
		await user.keyboard( '{ArrowDown}' );
		expect( grid ).toHaveAttribute(
			'aria-activedescendant',
			expect.stringMatching( /-cell-0-1$/ )
		);

		// ArrowRight moves to next column, same row (col 0→1, row 1)
		await user.keyboard( '{ArrowRight}' );
		expect( grid ).toHaveAttribute(
			'aria-activedescendant',
			expect.stringMatching( /-cell-1-1$/ )
		);
	} );

	test( 'ArrowUp and ArrowLeft move focus in the opposite direction', async () => {
		renderChart( { rowLabels: [ 'Mon', 'Tue', 'Wed' ] } );
		const grid = screen.getByRole( 'grid', { name: /heatmap/i } );
		const user = userEvent.setup();

		// Navigate to col 1, row 2 (bottom-right of a 2-col × 3-row grid)
		// First ArrowDown lands on (0,0); subsequent presses move from there.
		grid.focus();
		await user.keyboard( '{ArrowDown}{ArrowDown}{ArrowDown}{ArrowRight}' );
		expect( grid ).toHaveAttribute(
			'aria-activedescendant',
			expect.stringMatching( /-cell-1-2$/ )
		);

		// ArrowUp moves row 2→1 within col 1
		await user.keyboard( '{ArrowUp}' );
		expect( grid ).toHaveAttribute(
			'aria-activedescendant',
			expect.stringMatching( /-cell-1-1$/ )
		);

		// ArrowLeft moves col 1→0, same row
		await user.keyboard( '{ArrowLeft}' );
		expect( grid ).toHaveAttribute(
			'aria-activedescendant',
			expect.stringMatching( /-cell-0-1$/ )
		);
	} );

	test( 'ArrowLeft at column 0 and ArrowUp at row 0 clamp (no wrap)', async () => {
		renderChart( { rowLabels: [ 'Mon', 'Tue', 'Wed' ] } );
		const grid = screen.getByRole( 'grid', { name: /heatmap/i } );
		const user = userEvent.setup();

		// Start at col 0, row 0 (first ArrowDown sets index to row 1; press ArrowUp back to row 0)
		grid.focus();
		await user.keyboard( '{ArrowDown}{ArrowUp}' );
		expect( grid ).toHaveAttribute(
			'aria-activedescendant',
			expect.stringMatching( /-cell-0-0$/ )
		);

		// ArrowUp at row 0 stays at row 0
		await user.keyboard( '{ArrowUp}' );
		expect( grid ).toHaveAttribute(
			'aria-activedescendant',
			expect.stringMatching( /-cell-0-0$/ )
		);

		// ArrowLeft at col 0 stays at col 0
		await user.keyboard( '{ArrowLeft}' );
		expect( grid ).toHaveAttribute(
			'aria-activedescendant',
			expect.stringMatching( /-cell-0-0$/ )
		);
	} );

	test( 'Escape clears the selection (aria-activedescendant removed)', async () => {
		renderChart( { rowLabels: [ 'Mon', 'Tue', 'Wed' ] } );
		const grid = screen.getByRole( 'grid', { name: /heatmap/i } );
		const user = userEvent.setup();

		grid.focus();
		await user.keyboard( '{ArrowDown}' );
		expect( grid ).toHaveAttribute( 'aria-activedescendant' );

		await user.keyboard( '{Escape}' );
		expect( grid ).not.toHaveAttribute( 'aria-activedescendant' );
	} );

	test( 'rows contain gridcell children in the ARIA hierarchy', () => {
		renderChart();
		const rows = screen.getAllByRole( 'row' );
		expect( rows.length ).toBeGreaterThan( 0 );
		rows.forEach( row => {
			expect( within( row ).getAllByRole( 'gridcell' ).length ).toBeGreaterThan( 0 );
		} );
	} );

	test( 'keeps a strict grid → row structure (column labels live in a row, not directly under the grid)', () => {
		renderChart();
		// The header row is aria-hidden, so include hidden elements when querying for it.
		const rows = screen.getAllByRole( 'row', { hidden: true } );
		const headerRow = rows.find( row => within( row ).queryByText( 'W1' ) );
		expect( headerRow ).toBeDefined();
	} );

	test( 'leaves the cell gap to WPDS tokens in non-compact mode (no inline override)', () => {
		renderChart();
		const grid = screen.getByRole( 'grid', { name: /heatmap/i } );
		// Non-compact sets no inline gap — the SCSS falls back to the WPDS token.
		expect( grid.style.getPropertyValue( '--heatmap-cell-gap' ) ).toBe( '' );
	} );

	test( 'applies the compact gap inline from the theme compactCellGap', () => {
		render(
			<GlobalChartsProvider theme={ { heatmapChart: { compactCellGap: 3 } } }>
				<HeatmapChart width={ 500 } height={ 300 } data={ data } compact />
			</GlobalChartsProvider>
		);
		const grid = screen.getByRole( 'grid', { name: /heatmap/i } );
		expect( grid.style.getPropertyValue( '--heatmap-cell-gap' ) ).toBe( '3px' );
	} );

	test( 'sizes compact cells to the theme compactCellSize', () => {
		render(
			<GlobalChartsProvider theme={ { heatmapChart: { compactCellSize: 20 } } }>
				<HeatmapChart width={ 500 } height={ 300 } data={ data } compact />
			</GlobalChartsProvider>
		);
		const grid = screen.getByRole( 'grid', { name: /heatmap/i } );
		expect( grid.style.getPropertyValue( '--heatmap-cell-size' ) ).toBe( '20px' );
		// Compact track template is built from the fixed cell size.
		expect( grid.style.gridTemplateColumns ).toContain( 'var(--heatmap-cell-size)' );
	} );

	test( 'applies the primaryColor prop as the cell-scale color', () => {
		renderChart( { primaryColor: '#abcdef' } );
		const grid = screen.getByRole( 'grid', { name: /heatmap/i } );
		expect( grid.style.getPropertyValue( '--heatmap-primary' ) ).toBe( '#abcdef' );
	} );

	test( 'resolves primaryColor from the chart theme', () => {
		render(
			<GlobalChartsProvider theme={ { heatmapChart: { primaryColor: '#0a0b0c' } } }>
				<HeatmapChart width={ 500 } height={ 300 } data={ data } />
			</GlobalChartsProvider>
		);
		const grid = screen.getByRole( 'grid', { name: /heatmap/i } );
		expect( grid.style.getPropertyValue( '--heatmap-primary' ) ).toBe( '#0a0b0c' );
	} );

	test( 'falls back to the palette colors[0] when no prop or theme primaryColor is set', () => {
		render(
			<GlobalChartsProvider theme={ { colors: [ '#0a0b0c' ] } }>
				<HeatmapChart width={ 500 } height={ 300 } data={ data } />
			</GlobalChartsProvider>
		);
		const grid = screen.getByRole( 'grid', { name: /heatmap/i } );
		expect( grid.style.getPropertyValue( '--heatmap-primary' ) ).toBe( '#0a0b0c' );
	} );

	test( 'the unresponsive export pins explicit width and height', () => {
		render(
			<GlobalChartsProvider>
				<HeatmapChartUnresponsive width={ 480 } height={ 240 } data={ data } />
			</GlobalChartsProvider>
		);
		const chart = screen.getByTestId( 'heatmap-chart' );
		expect( chart ).toHaveStyle( { width: '480px', height: '240px' } );
	} );

	test( 'the responsive export leaves the chart unpinned so it fills its container', () => {
		render(
			<GlobalChartsProvider>
				<HeatmapChart width={ 500 } height={ 300 } data={ data } />
			</GlobalChartsProvider>
		);
		const chart = screen.getByTestId( 'heatmap-chart' );
		expect( chart ).not.toHaveStyle( { width: '500px' } );
		expect( chart ).not.toHaveStyle( { height: '300px' } );
	} );
} );
