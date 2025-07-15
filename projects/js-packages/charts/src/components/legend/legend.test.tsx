import { render, screen } from '@testing-library/react';
import { ChartContext } from '../../providers/chart-context/chart-context';
import { BaseLegend } from './base-legend';
import { Legend } from './legend';
import type { LegendProps } from './types';
import type { ChartContextValue } from '../../providers/chart-context/types';

const TestShape: LegendProps[ 'shape' ] = props => {
	return (
		<svg>
			<rect data-testid="legend-marker" fill={ props.fill } />
		</svg>
	);
};

describe( 'BaseLegend', () => {
	const defaultItems = [
		{ label: 'Item 1', value: '50%', color: '#ff0000' },
		{ label: 'Item 2', value: '30%', color: '#00ff00' },
	];

	test( 'renders horizontal legend items', () => {
		render( <BaseLegend items={ defaultItems } orientation="horizontal" /> );
		expect( screen.getByText( 'Item 1' ) ).toBeInTheDocument();
		expect( screen.getByText( 'Item 2' ) ).toBeInTheDocument();
		expect( screen.getByText( '50%' ) ).toBeInTheDocument();
		expect( screen.getByText( '30%' ) ).toBeInTheDocument();
	} );

	test( 'renders vertical legend items', () => {
		render( <BaseLegend items={ defaultItems } orientation="vertical" /> );
		const items = screen.getAllByText( /Item \d/ );
		expect( items ).toHaveLength( 2 );
	} );

	test( 'applies color styles to legend markers', () => {
		render( <BaseLegend items={ defaultItems } orientation="horizontal" shape={ TestShape } /> );
		const markers = screen.getAllByTestId( 'legend-marker' );
		expect( markers[ 0 ] ).toHaveAttribute( 'fill', '#ff0000' );
		expect( markers[ 1 ] ).toHaveAttribute( 'fill', '#00ff00' );
	} );

	test( 'handles empty items array', () => {
		render( <BaseLegend items={ [] } orientation="horizontal" /> );
		const legendItems = screen.queryAllByRole( 'listitem' );
		expect( legendItems ).toHaveLength( 0 );
	} );

	test( 'handles missing values', () => {
		const itemsWithoutValues = [
			{ label: 'Item 1', color: '#ff0000', value: undefined },
			{ label: 'Item 2', color: '#00ff00', value: undefined },
		];
		render( <BaseLegend items={ itemsWithoutValues } orientation="horizontal" /> );
		expect( screen.getByText( 'Item 1' ) ).toBeInTheDocument();
		expect( screen.getByText( 'Item 2' ) ).toBeInTheDocument();
	} );

	test( 'applies custom className', () => {
		render(
			<BaseLegend items={ defaultItems } className="custom-legend" orientation="horizontal" />
		);
		expect( screen.getByRole( 'list' ) ).toHaveClass( 'custom-legend' );
	} );

	test( 'renders with correct orientation styles', () => {
		const { rerender } = render( <BaseLegend items={ defaultItems } orientation="horizontal" /> );
		expect( screen.getByTestId( 'legend-horizontal' ) ).toBeInTheDocument();

		rerender( <BaseLegend items={ defaultItems } orientation="vertical" /> );
		expect( screen.getByTestId( 'legend-vertical' ) ).toBeInTheDocument();
	} );

	test( 'renders legend items with correct spacing', () => {
		render( <BaseLegend items={ defaultItems } orientation="horizontal" /> );
		const items = screen.getAllByTestId( 'legend-item' );
		expect( items ).toHaveLength( 2 );
	} );

	test( 'handles items with long labels', () => {
		const itemsWithLongLabels = [
			{ label: 'Very Long Label That Should Still Display', value: '50%', color: '#ff0000' },
			{ label: 'Another Long Label for Testing', value: '30%', color: '#00ff00' },
		];
		render( <BaseLegend items={ itemsWithLongLabels } orientation="horizontal" /> );
		expect( screen.getByText( 'Very Long Label That Should Still Display' ) ).toBeInTheDocument();
	} );
} );

describe( 'Legend', () => {
	const defaultItems = [
		{ label: 'Series 1', value: '60%', color: '#ff0000' },
		{ label: 'Series 2', value: '40%', color: '#00ff00' },
	];

	const mockContextValue: ChartContextValue = {
		charts: new Map(),
		registerChart: jest.fn(),
		unregisterChart: jest.fn(),
		getChartData: jest.fn(),
	};

	beforeEach( () => {
		jest.clearAllMocks();
		mockContextValue.charts.clear();
	} );

	test( 'renders with direct items prop', () => {
		render( <Legend items={ defaultItems } orientation="horizontal" /> );
		expect( screen.getByText( 'Series 1' ) ).toBeInTheDocument();
		expect( screen.getByText( 'Series 2' ) ).toBeInTheDocument();
		expect( screen.getByText( '60%' ) ).toBeInTheDocument();
		expect( screen.getByText( '40%' ) ).toBeInTheDocument();
	} );

	test( 'renders with chartId and context data', () => {
		const contextItems = [
			{ label: 'Context Item 1', value: '70%', color: '#0000ff' },
			{ label: 'Context Item 2', value: '30%', color: '#ffff00' },
		];

		( mockContextValue.getChartData as jest.Mock ).mockReturnValue( {
			legendItems: contextItems,
		} );

		render(
			<ChartContext.Provider value={ mockContextValue }>
				<Legend chartId="test-chart" items={ defaultItems } orientation="horizontal" />
			</ChartContext.Provider>
		);

		expect( screen.getByText( 'Context Item 1' ) ).toBeInTheDocument();
		expect( screen.getByText( 'Context Item 2' ) ).toBeInTheDocument();
		expect( screen.getByText( '70%' ) ).toBeInTheDocument();
		expect( screen.getByText( '30%' ) ).toBeInTheDocument();
		expect( mockContextValue.getChartData ).toHaveBeenCalledWith( 'test-chart' );
	} );

	test( 'falls back to items prop when chartId provided but no context data', () => {
		( mockContextValue.getChartData as jest.Mock ).mockReturnValue( undefined );

		render(
			<ChartContext.Provider value={ mockContextValue }>
				<Legend chartId="missing-chart" items={ defaultItems } orientation="horizontal" />
			</ChartContext.Provider>
		);

		expect( screen.getByText( 'Series 1' ) ).toBeInTheDocument();
		expect( screen.getByText( 'Series 2' ) ).toBeInTheDocument();
		expect( mockContextValue.getChartData ).toHaveBeenCalledWith( 'missing-chart' );
	} );

	test( 'falls back to items prop when chartId provided but no context', () => {
		render( <Legend chartId="test-chart" items={ defaultItems } orientation="horizontal" /> );

		expect( screen.getByText( 'Series 1' ) ).toBeInTheDocument();
		expect( screen.getByText( 'Series 2' ) ).toBeInTheDocument();
	} );

	test( 'returns null when no items provided and no context data', () => {
		( mockContextValue.getChartData as jest.Mock ).mockReturnValue( undefined );

		const { container } = render(
			<ChartContext.Provider value={ mockContextValue }>
				<Legend chartId="missing-chart" orientation="horizontal" />
			</ChartContext.Provider>
		);

		expect( container ).toBeEmptyDOMElement();
	} );

	test( 'returns null when no items and no chartId provided', () => {
		const { container } = render( <Legend orientation="horizontal" /> );

		expect( container ).toBeEmptyDOMElement();
	} );

	test( 'passes through other props to BaseLegend', () => {
		render(
			<Legend
				items={ defaultItems }
				orientation="vertical"
				className="custom-legend-class"
				data-testid="legend-component"
			/>
		);

		expect( screen.getByTestId( 'legend-vertical' ) ).toBeInTheDocument();
		expect( screen.getByRole( 'list' ) ).toHaveClass( 'custom-legend-class' );
	} );

	test( 'prioritizes context items over direct items when both are available', () => {
		const contextItems = [ { label: 'Priority Item', value: '100%', color: '#purple' } ];

		( mockContextValue.getChartData as jest.Mock ).mockReturnValue( {
			legendItems: contextItems,
		} );

		render(
			<ChartContext.Provider value={ mockContextValue }>
				<Legend chartId="test-chart" items={ defaultItems } orientation="horizontal" />
			</ChartContext.Provider>
		);

		expect( screen.getByText( 'Priority Item' ) ).toBeInTheDocument();
		expect( screen.queryByText( 'Series 1' ) ).not.toBeInTheDocument();
		expect( screen.queryByText( 'Series 2' ) ).not.toBeInTheDocument();
	} );
} );
