import { render, screen, fireEvent } from '@testing-library/react';
import DiffView from '../components/diff-view';

describe( 'DiffView', () => {
	it( 'renders added text in <ins> and removed text in <del>', () => {
		const { container } = render(
			<DiffView original="the cat sat" suggestion="the dog sat" onAccept={ jest.fn() } />
		);

		expect( container.querySelector( 'ins' ) ).toHaveTextContent( 'dog' );
		expect( container.querySelector( 'del' ) ).toHaveTextContent( 'cat' );
	} );

	it( 'renders no diff marks when there is no suggestion', () => {
		const { container } = render(
			<DiffView original="anything" suggestion="" onAccept={ jest.fn() } />
		);

		expect( container.querySelector( 'ins' ) ).toBeNull();
		expect( container.querySelector( 'del' ) ).toBeNull();
	} );

	it( 'calls onAccept on click', () => {
		const onAccept = jest.fn();
		render( <DiffView original="a" suggestion="b" onAccept={ onAccept } /> );

		fireEvent.click( screen.getByRole( 'button', { name: /accept suggested changes/i } ) );

		expect( onAccept ).toHaveBeenCalledTimes( 1 );
	} );

	it( 'accepts via Enter and Space but ignores other keys', () => {
		const onAccept = jest.fn();
		render( <DiffView original="a" suggestion="b" onAccept={ onAccept } /> );
		const target = screen.getByRole( 'button', { name: /accept suggested changes/i } );

		fireEvent.keyDown( target, { key: 'Enter' } );
		fireEvent.keyDown( target, { key: ' ' } );
		fireEvent.keyDown( target, { key: 'a' } );

		expect( onAccept ).toHaveBeenCalledTimes( 2 );
	} );

	it( 'applies an explicit height when provided', () => {
		render( <DiffView original="a" suggestion="b" onAccept={ jest.fn() } height={ 120 } /> );

		expect( screen.getByRole( 'button', { name: /accept suggested changes/i } ) ).toHaveStyle(
			{ height: '120px' }
		);
	} );
} );
