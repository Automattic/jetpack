/**
 * External dependencies
 */
import { describe, expect, it, jest } from '@jest/globals';
import { renderHook } from '@testing-library/react';
/**
 * Internal dependencies
 */
import useResponseKeyboardShortcuts, {
	SHORTCUTS,
} from '../../../../routes/response/use-keyboard-shortcuts.ts';

/**
 * Dispatch a keydown on the window.
 *
 * @param {string} key       - The produced character.
 * @param {object} [options] - Extra event options.
 * @return {KeyboardEvent} The dispatched event.
 */
function press( key, options = {} ) {
	const event = new KeyboardEvent( 'keydown', {
		key,
		bubbles: true,
		cancelable: true,
		...options,
	} );
	window.dispatchEvent( event );
	return event;
}

describe( 'useResponseKeyboardShortcuts', () => {
	const handlers = () => ( {
		onNext: jest.fn(),
		onPrevious: jest.fn(),
		onMarkAsSpam: jest.fn(),
		onMoveToTrash: jest.fn(),
		onGoToList: jest.fn(),
	} );

	it( 'binds the documented keys', () => {
		const h = handlers();
		renderHook( () => useResponseKeyboardShortcuts( h ) );

		press( SHORTCUTS.next );
		press( SHORTCUTS.previous );
		press( SHORTCUTS.markAsSpam );
		press( SHORTCUTS.moveToTrash );
		press( SHORTCUTS.goToList );

		expect( h.onNext ).toHaveBeenCalledTimes( 1 );
		expect( h.onPrevious ).toHaveBeenCalledTimes( 1 );
		expect( h.onMarkAsSpam ).toHaveBeenCalledTimes( 1 );
		expect( h.onMoveToTrash ).toHaveBeenCalledTimes( 1 );
		expect( h.onGoToList ).toHaveBeenCalledTimes( 1 );
	} );

	it( 'keeps the arrow keys alongside j/k', () => {
		const h = handlers();
		renderHook( () => useResponseKeyboardShortcuts( h ) );

		press( 'ArrowDown' );
		press( 'ArrowUp' );

		expect( h.onNext ).toHaveBeenCalledTimes( 1 );
		expect( h.onPrevious ).toHaveBeenCalledTimes( 1 );
	} );

	// Both destructive keys are shifted symbols, so bailing out on Shift would
	// unbind exactly the two shortcuts that matter most.
	it( 'runs the destructive shortcuts even though they need Shift', () => {
		const h = handlers();
		renderHook( () => useResponseKeyboardShortcuts( h ) );

		press( SHORTCUTS.markAsSpam, { shiftKey: true } );
		press( SHORTCUTS.moveToTrash, { shiftKey: true } );

		expect( h.onMarkAsSpam ).toHaveBeenCalledTimes( 1 );
		expect( h.onMoveToTrash ).toHaveBeenCalledTimes( 1 );
	} );

	it.each( [ [ 'metaKey' ], [ 'ctrlKey' ], [ 'altKey' ] ] )(
		'ignores keys held with %s',
		modifier => {
			const h = handlers();
			renderHook( () => useResponseKeyboardShortcuts( h ) );

			press( SHORTCUTS.next, { [ modifier ]: true } );

			expect( h.onNext ).not.toHaveBeenCalled();
		}
	);

	it( 'does nothing while a shortcut is suspended', () => {
		const h = handlers();
		renderHook( () => useResponseKeyboardShortcuts( h, { isDisabled: true } ) );

		press( SHORTCUTS.markAsSpam );

		expect( h.onMarkAsSpam ).not.toHaveBeenCalled();
	} );

	// A missing handler is how the page unbinds a key it cannot honour — at the ends
	// of the list, or while the record on screen isn't the one the URL names.
	it( 'leaves a key unbound when its handler is absent', () => {
		renderHook( () => useResponseKeyboardShortcuts( { onNext: undefined } ) );

		expect( press( SHORTCUTS.next ).defaultPrevented ).toBe( false );
	} );

	it( 'only preventDefaults keys it actually handles', () => {
		const h = handlers();
		renderHook( () => useResponseKeyboardShortcuts( h ) );

		expect( press( SHORTCUTS.next ).defaultPrevented ).toBe( true );
		expect( press( 'x' ).defaultPrevented ).toBe( false );
	} );

	it( 'ignores keys typed into a field', () => {
		const h = handlers();
		renderHook( () => useResponseKeyboardShortcuts( h ) );

		const input = document.createElement( 'input' );
		document.body.appendChild( input );
		input.dispatchEvent(
			new KeyboardEvent( 'keydown', { key: SHORTCUTS.markAsSpam, bubbles: true } )
		);

		expect( h.onMarkAsSpam ).not.toHaveBeenCalled();
		input.remove();
	} );
} );
