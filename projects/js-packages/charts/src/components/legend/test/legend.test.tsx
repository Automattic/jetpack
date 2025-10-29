/* eslint-disable react/jsx-no-bind */
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { GlobalChartsProvider } from '../../../providers';
import { BaseLegend } from '../private/base-legend';
import type { LegendProps } from '../types';

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

	test( 'applies legendItemClassName to legend items', () => {
		render(
			<BaseLegend
				items={ defaultItems }
				orientation="horizontal"
				legendItemClassName="custom-legend-item"
			/>
		);
		const legendItems = screen.getAllByTestId( 'legend-item' );
		legendItems.forEach( item => {
			expect( item ).toHaveClass( 'custom-legend-item' );
		} );
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

	describe( 'text wrapping behavior', () => {
		const longLabelItems = [
			{ label: 'Very Long Label That Should Wrap or Truncate', value: '50%', color: '#ff0000' },
			{ label: 'Another Long Label for Testing', value: '30%', color: '#00ff00' },
		];

		test( 'renders with maxWidth constraint', () => {
			render( <BaseLegend items={ longLabelItems } maxWidth="150px" orientation="horizontal" /> );
			const legendItems = screen.getAllByTestId( 'legend-item' );
			expect( legendItems ).toHaveLength( 2 );
			// Note: maxWidth is applied to LegendLabel via inline styles,
			// which is harder to test without DOM traversal
		} );

		test( 'renders with maxWidth as string', () => {
			render( <BaseLegend items={ longLabelItems } maxWidth="10rem" orientation="horizontal" /> );
			const legendItems = screen.getAllByTestId( 'legend-item' );
			expect( legendItems ).toHaveLength( 2 );
			// Note: maxWidth is applied to LegendLabel via inline styles
		} );

		test( 'renders correctly with and without maxWidth', () => {
			const { rerender } = render(
				<BaseLegend items={ longLabelItems } orientation="horizontal" />
			);

			// Without maxWidth, legend items should render normally
			let legendItems = screen.getAllByTestId( 'legend-item' );
			expect( legendItems ).toHaveLength( 2 );

			// With maxWidth, legend items should still render
			rerender( <BaseLegend items={ longLabelItems } maxWidth="150px" orientation="horizontal" /> );
			legendItems = screen.getAllByTestId( 'legend-item' );
			expect( legendItems ).toHaveLength( 2 );
		} );

		test( 'renders with different textOverflow values', () => {
			// Test ellipsis behavior - should render without errors
			const { rerender } = render(
				<BaseLegend
					items={ longLabelItems }
					maxWidth="150px"
					textOverflow="ellipsis"
					orientation="horizontal"
				/>
			);
			let labels = screen.getAllByText( /Long Label/ );
			expect( labels ).toHaveLength( 2 );

			// Test wrap behavior - should render without errors
			rerender(
				<BaseLegend
					items={ longLabelItems }
					maxWidth="150px"
					textOverflow="wrap"
					orientation="horizontal"
				/>
			);
			labels = screen.getAllByText( /Long Label/ );
			expect( labels ).toHaveLength( 2 );
		} );

		test( 'renders ellipsis mode without errors', () => {
			// Render with ellipsis overflow
			render(
				<BaseLegend
					items={ longLabelItems }
					maxWidth="50px"
					textOverflow="ellipsis"
					orientation="horizontal"
				/>
			);

			// Verify the text is rendered
			const labels = screen.getAllByText( /Long Label/ );
			expect( labels ).toHaveLength( 2 );
		} );

		test( 'renders wrap mode without errors', () => {
			// Render with wrap overflow
			render(
				<BaseLegend
					items={ longLabelItems }
					maxWidth="50px"
					textOverflow="wrap"
					orientation="horizontal"
				/>
			);

			// Verify the text is rendered
			const labels = screen.getAllByText( /Long Label/ );
			expect( labels ).toHaveLength( 2 );
		} );

		test( 'handles maxWidth={0} correctly', () => {
			// maxWidth={0} should apply 0-pixel constraint (not be treated as "no constraint")
			render(
				<BaseLegend
					items={ longLabelItems }
					maxWidth="0px"
					textOverflow="ellipsis"
					orientation="horizontal"
				/>
			);

			// Should still render the legend items
			const legendItems = screen.getAllByTestId( 'legend-item' );
			expect( legendItems ).toHaveLength( 2 );
		} );
	} );

	describe( 'custom render prop', () => {
		test( 'calls render function with items', () => {
			const renderFn = jest.fn( () => <div data-testid="custom-legend">Custom Legend</div> );
			render( <BaseLegend items={ defaultItems } orientation="horizontal" render={ renderFn } /> );

			expect( renderFn ).toHaveBeenCalledWith( defaultItems );
			expect( screen.getByTestId( 'custom-legend' ) ).toBeInTheDocument();
		} );

		test( 'uses custom render instead of default legend markup', () => {
			const renderFn = () => (
				<div data-testid="custom-legend">
					<span>Custom rendering</span>
				</div>
			);
			render( <BaseLegend items={ defaultItems } orientation="horizontal" render={ renderFn } /> );

			// Custom markup should be present
			expect( screen.getByTestId( 'custom-legend' ) ).toBeInTheDocument();
			expect( screen.getByText( 'Custom rendering' ) ).toBeInTheDocument();

			// Default legend markup should not be present
			expect( screen.queryByTestId( 'legend-horizontal' ) ).not.toBeInTheDocument();
			expect( screen.queryByTestId( 'legend-item' ) ).not.toBeInTheDocument();
		} );

		test( 'custom render can access all item properties', () => {
			const renderFn = ( items: typeof defaultItems ) => (
				<ul data-testid="custom-legend-list">
					{ items.map( ( item, index ) => (
						<li key={ index } data-testid={ `custom-item-${ index }` }>
							<span style={ { color: item.color } }>{ item.label }</span>
							<span>{ item.value }</span>
						</li>
					) ) }
				</ul>
			);
			render( <BaseLegend items={ defaultItems } orientation="horizontal" render={ renderFn } /> );

			expect( screen.getByTestId( 'custom-legend-list' ) ).toBeInTheDocument();
			expect( screen.getByTestId( 'custom-item-0' ) ).toBeInTheDocument();
			expect( screen.getByTestId( 'custom-item-1' ) ).toBeInTheDocument();
			expect( screen.getByText( 'Item 1' ) ).toBeInTheDocument();
			expect( screen.getByText( 'Item 2' ) ).toBeInTheDocument();
		} );

		test( 'custom render handles empty items array', () => {
			const renderFn = ( items: typeof defaultItems ) => (
				<div data-testid="custom-legend">
					{ items.length === 0 ? 'No items' : `${ items.length } items` }
				</div>
			);
			render( <BaseLegend items={ [] } orientation="horizontal" render={ renderFn } /> );

			expect( screen.getByTestId( 'custom-legend' ) ).toBeInTheDocument();
			expect( screen.getByText( 'No items' ) ).toBeInTheDocument();
		} );

		test( 'custom render can create alternative layouts', () => {
			const renderFn = ( items: typeof defaultItems ) => (
				<div data-testid="custom-grid-legend" style={ { display: 'grid' } }>
					{ items.map( ( item, index ) => (
						<div key={ index } data-testid="grid-item">
							<div style={ { backgroundColor: item.color, width: 20, height: 20 } } />
							<div>{ item.label }</div>
							<div>{ item.value }</div>
						</div>
					) ) }
				</div>
			);
			render( <BaseLegend items={ defaultItems } orientation="horizontal" render={ renderFn } /> );

			expect( screen.getByTestId( 'custom-grid-legend' ) ).toBeInTheDocument();
			const gridItems = screen.getAllByTestId( 'grid-item' );
			expect( gridItems ).toHaveLength( 2 );
		} );

		test( 'custom render with complex JSX structure', () => {
			const renderFn = ( items: typeof defaultItems ) => (
				<div data-testid="complex-legend">
					<h3>Legend Title</h3>
					<div className="legend-body">
						{ items.map( ( item, index ) => (
							<div key={ index } className="legend-row">
								<svg width={ 10 } height={ 10 }>
									<circle cx={ 5 } cy={ 5 } r={ 5 } fill={ item.color } />
								</svg>
								<span>{ item.label }: </span>
								<strong>{ item.value }</strong>
							</div>
						) ) }
					</div>
				</div>
			);
			render( <BaseLegend items={ defaultItems } orientation="horizontal" render={ renderFn } /> );

			expect( screen.getByTestId( 'complex-legend' ) ).toBeInTheDocument();
			expect( screen.getByText( 'Legend Title' ) ).toBeInTheDocument();
			expect( screen.getByText( 'Item 1:' ) ).toBeInTheDocument();
			expect( screen.getByText( '50%' ) ).toBeInTheDocument();
		} );

		test( 'orientation prop is ignored when using custom render', () => {
			const renderFn = () => <div data-testid="custom-legend">Custom</div>;
			const { rerender } = render(
				<BaseLegend items={ defaultItems } orientation="horizontal" render={ renderFn } />
			);

			expect( screen.getByTestId( 'custom-legend' ) ).toBeInTheDocument();
			expect( screen.queryByTestId( 'legend-horizontal' ) ).not.toBeInTheDocument();

			rerender( <BaseLegend items={ defaultItems } orientation="vertical" render={ renderFn } /> );

			expect( screen.getByTestId( 'custom-legend' ) ).toBeInTheDocument();
			expect( screen.queryByTestId( 'legend-vertical' ) ).not.toBeInTheDocument();
		} );
	} );

	describe( 'Interactive legend', () => {
		it( 'renders interactive legend items with proper attributes', () => {
			render(
				<GlobalChartsProvider>
					<BaseLegend items={ defaultItems } interactive={ true } chartId="test-chart" />
				</GlobalChartsProvider>
			);

			const legendItems = screen.getAllByRole( 'button' );
			expect( legendItems ).toHaveLength( 2 );
			expect( legendItems[ 0 ] ).toHaveAttribute( 'tabIndex', '0' );
			expect( legendItems[ 0 ] ).toHaveAttribute( 'aria-pressed', 'true' );
		} );

		it( 'handles click events to toggle visibility', async () => {
			const user = userEvent.setup();

			render(
				<GlobalChartsProvider>
					<BaseLegend items={ defaultItems } interactive={ true } chartId="test-chart" />
				</GlobalChartsProvider>
			);

			const legendItems = screen.getAllByRole( 'button' );

			// Click to toggle
			await user.click( legendItems[ 0 ] );

			// After click, the aria-pressed should change
			expect( legendItems[ 0 ] ).toHaveAttribute( 'aria-pressed', 'false' );
		} );

		it( 'handles Enter key to toggle visibility', async () => {
			const user = userEvent.setup();

			render(
				<GlobalChartsProvider>
					<BaseLegend items={ defaultItems } interactive={ true } chartId="test-chart" />
				</GlobalChartsProvider>
			);

			const legendItems = screen.getAllByRole( 'button' );
			legendItems[ 0 ].focus();

			// Press Enter
			await user.keyboard( '{Enter}' );

			expect( legendItems[ 0 ] ).toHaveAttribute( 'aria-pressed', 'false' );
		} );

		it( 'handles Space key to toggle visibility', async () => {
			const user = userEvent.setup();

			render(
				<GlobalChartsProvider>
					<BaseLegend items={ defaultItems } interactive={ true } chartId="test-chart" />
				</GlobalChartsProvider>
			);

			const legendItems = screen.getAllByRole( 'button' );
			legendItems[ 1 ].focus();

			// Press Space
			await user.keyboard( ' ' );

			expect( legendItems[ 1 ] ).toHaveAttribute( 'aria-pressed', 'false' );
		} );

		it( 'does not toggle on non-action keys', async () => {
			const user = userEvent.setup();

			render(
				<GlobalChartsProvider>
					<BaseLegend items={ defaultItems } interactive={ true } chartId="test-chart" />
				</GlobalChartsProvider>
			);

			const legendItems = screen.getAllByRole( 'button' );
			legendItems[ 0 ].focus();

			// Press a random key
			await user.keyboard( 'a' );

			// Should remain pressed (visible)
			expect( legendItems[ 0 ] ).toHaveAttribute( 'aria-pressed', 'true' );
		} );

		it( 'renders non-interactive legend when interactive is false', () => {
			render(
				<GlobalChartsProvider>
					<BaseLegend items={ defaultItems } interactive={ false } chartId="test-chart" />
				</GlobalChartsProvider>
			);

			const buttons = screen.queryAllByRole( 'button' );
			expect( buttons ).toHaveLength( 0 );
		} );

		it( 'works without chartId but does not toggle', async () => {
			const user = userEvent.setup();

			render(
				<GlobalChartsProvider>
					<BaseLegend items={ defaultItems } interactive={ true } />
				</GlobalChartsProvider>
			);

			const legendItems = screen.getAllByRole( 'button' );

			// Click should not change state without chartId
			await user.click( legendItems[ 0 ] );

			// Should still be visible (pressed)
			expect( legendItems[ 0 ] ).toHaveAttribute( 'aria-pressed', 'true' );
		} );
	} );
} );
