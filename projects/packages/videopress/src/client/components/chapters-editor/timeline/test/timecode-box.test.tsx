import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import TimecodeBox from '../timecode-box';

/**
 * Render the box and return its collaborators.
 *
 * @param valueMs - Live playhead position in ms.
 * @return The onSeek spy and the input element.
 */
function renderBox( valueMs = 0 ) {
	const onSeek = jest.fn();
	render( <TimecodeBox valueMs={ valueMs } onSeek={ onSeek } /> );
	return { onSeek, input: screen.getByRole( 'textbox', { name: 'Playhead time' } ) };
}

describe( 'TimecodeBox', () => {
	it( 'shows the live formatted position while idle', () => {
		const { input } = renderBox( 2500 );
		expect( input ).toHaveValue( '0:00:02.5' );
	} );

	it( 'seeks on Enter with the parsed position', async () => {
		const { onSeek, input } = renderBox();
		await userEvent.clear( input );
		await userEvent.type( input, '1:05{Enter}' );
		expect( onSeek ).toHaveBeenCalledWith( 65000 );
	} );

	it( 'commits on blur too', async () => {
		const { onSeek, input } = renderBox();
		await userEvent.clear( input );
		await userEvent.type( input, '3' );
		await userEvent.tab();
		expect( onSeek ).toHaveBeenCalledWith( 3000 );
	} );

	it( 'reverts the draft on Escape', async () => {
		const { onSeek, input } = renderBox();
		await userEvent.clear( input );
		await userEvent.type( input, '5{Escape}' );
		expect( onSeek ).not.toHaveBeenCalled();
		expect( input ).toHaveValue( '0:00:00.0' );
	} );

	it( 'marks Escape handled so modal hosts do not also close on it', () => {
		const { input } = renderBox();
		input.focus();
		const escape = new KeyboardEvent( 'keydown', {
			key: 'Escape',
			bubbles: true,
			cancelable: true,
		} );
		input.dispatchEvent( escape );
		expect( escape.defaultPrevented ).toBe( true );
	} );

	it( 'ignores input that does not parse as a timecode', async () => {
		const { onSeek, input } = renderBox();
		await userEvent.clear( input );
		await userEvent.type( input, 'garbage{Enter}' );
		expect( onSeek ).not.toHaveBeenCalled();
		expect( input ).toHaveValue( '0:00:00.0' );
	} );
} );
