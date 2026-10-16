import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import DiffView from '../components/diff-view';

describe( 'DiffView', () => {
	it( 'renders added text in <ins> and removed text in <del>', () => {
		render( <DiffView original="the cat sat" suggestion="the dog sat" onAccept={ jest.fn() } /> );

		expect( screen.getByText( 'dog' ).tagName ).toBe( 'INS' );
		expect( screen.getByText( 'cat' ).tagName ).toBe( 'DEL' );
	} );

	it( 'renders no diff marks when there is no suggestion', () => {
		render( <DiffView original="anything" suggestion="" onAccept={ jest.fn() } /> );

		// With no suggestion the diff is empty, so the original text is not shown.
		expect( screen.queryByText( 'anything' ) ).not.toBeInTheDocument();
	} );

	it( 'calls onAccept on click', async () => {
		const user = userEvent.setup();
		const onAccept = jest.fn();
		render( <DiffView original="a" suggestion="b" onAccept={ onAccept } /> );

		await user.click( screen.getByRole( 'button', { name: /accept suggested changes/i } ) );

		expect( onAccept ).toHaveBeenCalledTimes( 1 );
	} );

	it( 'accepts via Enter and Space but ignores other keys', () => {
		const onAccept = jest.fn();
		render( <DiffView original="a" suggestion="b" onAccept={ onAccept } /> );
		const target = screen.getByRole( 'button', { name: /accept suggested changes/i } );

		// fireEvent is the surgical tool here: we're exercising the component's
		// onKeyDown handler directly, not simulating a full user gesture.
		/* eslint-disable testing-library/prefer-user-event */
		fireEvent.keyDown( target, { key: 'Enter' } );
		fireEvent.keyDown( target, { key: ' ' } );
		fireEvent.keyDown( target, { key: 'a' } );
		/* eslint-enable testing-library/prefer-user-event */

		expect( onAccept ).toHaveBeenCalledTimes( 2 );
	} );

	it( 'applies an explicit height when provided', () => {
		render( <DiffView original="a" suggestion="b" onAccept={ jest.fn() } height={ 120 } /> );

		expect( screen.getByRole( 'button', { name: /accept suggested changes/i } ) ).toHaveStyle( {
			height: '120px',
		} );
	} );
} );
