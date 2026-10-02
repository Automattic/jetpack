/* No jest-dom or user-event in this project. */
/* eslint-disable jest-dom/prefer-to-have-text-content, jest-dom/prefer-to-have-attribute, testing-library/prefer-user-event */
import { act, fireEvent, render, screen } from '@testing-library/react';
import CopyLogButton from './copy-log-button';

describe( 'CopyLogButton', () => {
	const writeText = jest.fn();

	beforeEach( () => {
		jest.useFakeTimers();
		writeText.mockClear();
		Object.assign( navigator, { clipboard: { writeText } } );
	} );

	afterEach( () => {
		jest.useRealTimers();
	} );

	it( 'copies the text and reads "Copied!" for three seconds', () => {
		render( <CopyLogButton text="log line" /> );
		const button = screen.getByRole( 'button', { name: 'Copy to clipboard' } );

		fireEvent.click( button );

		expect( writeText ).toHaveBeenCalledWith( 'log line' );
		expect( button.textContent ).toBe( 'Copied!' );
		expect( button.getAttribute( 'aria-label' ) ).toBe( 'Copy to clipboard' );

		act( () => {
			jest.advanceTimersByTime( 3000 );
		} );
		expect( button.textContent ).toBe( 'Copy to clipboard' );
	} );

	it( 'restarts the reset timer on a second click', () => {
		render( <CopyLogButton text="log line" /> );
		const button = screen.getByRole( 'button' );

		fireEvent.click( button );
		act( () => {
			jest.advanceTimersByTime( 2000 );
		} );
		fireEvent.click( button );
		act( () => {
			jest.advanceTimersByTime( 2000 );
		} );

		expect( button.textContent ).toBe( 'Copied!' );
	} );
} );
