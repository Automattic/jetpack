import { render, screen } from '@testing-library/react';
import { createRef } from 'react';
import { Center } from '../index';

describe( 'Center', () => {
	test( 'renders its children', () => {
		render(
			<Center data-testid="center">
				<span>Centered content</span>
			</Center>
		);
		expect( screen.getByTestId( 'center' ) ).toHaveTextContent( 'Centered content' );
	} );

	test( 'merges a custom className with the center class', () => {
		render(
			<Center data-testid="center" className="custom-class">
				child
			</Center>
		);
		const el = screen.getByTestId( 'center' );
		expect( el ).toHaveClass( 'center' );
		expect( el ).toHaveClass( 'custom-class' );
	} );

	test( 'forwards its ref to the underlying element', () => {
		const ref = createRef< HTMLDivElement >();
		render( <Center ref={ ref }>child</Center> );
		expect( ref.current ).toBeInstanceOf( HTMLElement );
	} );

	test( 'spreads arbitrary props through to the element', () => {
		render(
			<Center data-testid="center" style={ { width: 120 } }>
				child
			</Center>
		);
		expect( screen.getByTestId( 'center' ) ).toHaveStyle( { width: '120px' } );
	} );

	test( 'centers on both axes by default', () => {
		render( <Center data-testid="center">child</Center> );
		expect( screen.getByTestId( 'center' ) ).toHaveStyle( {
			alignItems: 'center',
			justifyContent: 'center',
		} );
	} );

	test( 'allows overriding the align and justify defaults', () => {
		render(
			<Center data-testid="center" align="flex-start" justify="flex-end">
				child
			</Center>
		);
		expect( screen.getByTestId( 'center' ) ).toHaveStyle( {
			alignItems: 'flex-start',
			justifyContent: 'flex-end',
		} );
	} );
} );
