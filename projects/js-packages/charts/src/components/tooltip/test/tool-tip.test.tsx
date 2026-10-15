import { render, screen } from '@testing-library/react';
import { BaseTooltip } from '../base-tooltip';

describe( 'BaseTooltip', () => {
	const defaultProps = {
		data: {
			label: 'Test Label',
			value: 100,
			valueDisplay: '100%',
		},
		top: 100,
		left: 200,
	};

	test( 'renders default tooltip content', () => {
		render( <BaseTooltip { ...defaultProps } /> );
		expect( screen.getByText( 'Test Label: 100%' ) ).toBeInTheDocument();
		expect( screen.getByRole( 'tooltip' ) ).toBeInTheDocument();
	} );

	test( 'renders children instead of data when provided', () => {
		render(
			<BaseTooltip top={ 100 } left={ 200 }>
				<div>Custom Child Content</div>
			</BaseTooltip>
		);
		expect( screen.getByText( 'Custom Child Content' ) ).toBeInTheDocument();
	} );

	it( 'places a legacy box centered above its point', () => {
		render( <BaseTooltip { ...defaultProps } /> );
		expect( screen.getByRole( 'tooltip' ) ).toHaveStyle( {
			position: 'absolute',
			top: '100px',
			left: '200px',
			transform: 'translate(-50%, -100%)',
		} );
		expect( screen.getByRole( 'tooltip' ) ).toHaveClass( 'visx-tooltip', 'surface' );
	} );

	it( 'renders in flow without top and left', () => {
		render( <BaseTooltip>Content</BaseTooltip> );
		expect( screen.getByRole( 'tooltip' ) ).not.toHaveStyle( { position: 'absolute' } );
	} );

	test( 'handles missing valueDisplay', () => {
		const propsWithoutDisplay = {
			...defaultProps,
			data: {
				label: 'Test',
				value: 50,
			},
		};
		render( <BaseTooltip { ...propsWithoutDisplay } /> );
		expect( screen.getByText( 'Test: 50' ) ).toBeInTheDocument();
	} );
} );
