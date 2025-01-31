import { render, screen } from '@testing-library/react';
import { BaseLegend } from './base-legend';

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
		render( <BaseLegend items={ defaultItems } orientation="horizontal" /> );
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
} );
