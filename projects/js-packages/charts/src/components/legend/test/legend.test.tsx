import { render, screen } from '@testing-library/react';
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

		test( 'applies maxWidth constraint to legend items', () => {
			render( <BaseLegend items={ longLabelItems } maxWidth={ 150 } orientation="horizontal" /> );
			const items = screen.getAllByTestId( 'legend-item' );
			items.forEach( item => {
				expect( item ).toHaveStyle( { maxWidth: '150px' } );
			} );
		} );

		test( 'applies maxWidth as string with unit', () => {
			render( <BaseLegend items={ longLabelItems } maxWidth="10rem" orientation="horizontal" /> );
			const items = screen.getAllByTestId( 'legend-item' );
			items.forEach( item => {
				expect( item ).toHaveStyle( { maxWidth: '10rem' } );
			} );
		} );

		test( 'renders correctly with and without maxWidth', () => {
			const { rerender } = render(
				<BaseLegend items={ longLabelItems } orientation="horizontal" />
			);

			// Without maxWidth, legend items should render normally
			let legendItems = screen.getAllByTestId( 'legend-item' );
			expect( legendItems ).toHaveLength( 2 );

			// With maxWidth, legend items should be constrained
			rerender( <BaseLegend items={ longLabelItems } maxWidth={ 150 } orientation="horizontal" /> );
			legendItems = screen.getAllByTestId( 'legend-item' );
			expect( legendItems ).toHaveLength( 2 );

			// The legend items should have the maxWidth constraint applied
			legendItems.forEach( item => {
				expect( item ).toHaveStyle( { maxWidth: '150px' } );
			} );
		} );
	} );
} );
