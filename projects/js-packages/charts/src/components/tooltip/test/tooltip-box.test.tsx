import { render, screen } from '@testing-library/react';
import { createRef } from 'react';
import { TooltipBox } from '../tooltip-box';

describe( 'TooltipBox', () => {
	it( 'renders the styled box with the class consumers target', () => {
		render( <TooltipBox>Content</TooltipBox> );
		const box = screen.getByRole( 'tooltip' );
		expect( box ).toHaveTextContent( 'Content' );
		expect( box ).toHaveClass( 'visx-tooltip', 'surface', 'a8c-charts-scope' );
	} );

	it( 'leaves positioning to the caller', () => {
		render(
			<TooltipBox style={ { position: 'absolute', left: 12, top: 34 } }>Content</TooltipBox>
		);
		expect( screen.getByRole( 'tooltip' ) ).toHaveStyle( {
			position: 'absolute',
			left: '12px',
			top: '34px',
		} );
	} );

	it( 'keeps a caller class beside the surface', () => {
		render( <TooltipBox className="custom">Content</TooltipBox> );
		expect( screen.getByRole( 'tooltip' ) ).toHaveClass( 'surface', 'custom' );
	} );

	it( 'drops the surface and scope class when unstyled, keeping style', () => {
		render(
			<TooltipBox unstyled style={ { left: 5 } }>
				Content
			</TooltipBox>
		);
		const box = screen.getByRole( 'tooltip' );
		expect( box ).not.toHaveClass( 'surface' );
		expect( box ).not.toHaveClass( 'a8c-charts-scope' );
		expect( box ).toHaveClass( 'visx-tooltip' );
		expect( box ).toHaveStyle( { left: '5px' } );
	} );

	it( 'lets the caller replace the role', () => {
		render( <TooltipBox role="presentation">Content</TooltipBox> );
		expect( screen.queryByRole( 'tooltip' ) ).not.toBeInTheDocument();
	} );

	it( 'forwards its ref to the box', () => {
		const ref = createRef< HTMLDivElement >();
		render( <TooltipBox ref={ ref }>Content</TooltipBox> );
		expect( ref.current ).toBe( screen.getByRole( 'tooltip' ) );
	} );
} );
