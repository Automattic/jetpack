/**
 * External dependencies
 */
import { describe, expect, it, jest } from '@jest/globals';
import { renderHook } from '@testing-library/react';
/**
 * Internal dependencies
 */
import useResponseKeyboardShortcuts, {
	SHORTCUT_KEYS,
	getShortcutLabel,
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

	/**
	 * Mount the hook and hand back the spies it was given.
	 *
	 * @param {object} [options] - Hook options.
	 * @return {object} The handler spies.
	 */
	const setup = options => {
		const h = handlers();
		renderHook( () => useResponseKeyboardShortcuts( h, options ) );
		return h;
	};

	it( 'binds the documented keys', () => {
		const h = setup();

		press( SHORTCUT_KEYS.next );
		press( SHORTCUT_KEYS.previous );
		press( SHORTCUT_KEYS.markAsSpam );
		press( SHORTCUT_KEYS.moveToTrash );
		press( SHORTCUT_KEYS.goToList );

		expect( h.onNext ).toHaveBeenCalledTimes( 1 );
		expect( h.onPrevious ).toHaveBeenCalledTimes( 1 );
		expect( h.onMarkAsSpam ).toHaveBeenCalledTimes( 1 );
		expect( h.onMoveToTrash ).toHaveBeenCalledTimes( 1 );
		expect( h.onGoToList ).toHaveBeenCalledTimes( 1 );
	} );

	it( 'keeps the arrow keys alongside j/k', () => {
		const h = setup();

		press( 'ArrowDown' );
		press( 'ArrowUp' );

		expect( h.onNext ).toHaveBeenCalledTimes( 1 );
		expect( h.onPrevious ).toHaveBeenCalledTimes( 1 );
	} );

	// Both destructive keys are shifted symbols, so bailing out on Shift would
	// unbind exactly the two shortcuts that matter most.
	it( 'runs the destructive shortcuts even though they need Shift', () => {
		const h = setup();

		press( SHORTCUT_KEYS.markAsSpam, { shiftKey: true } );
		press( SHORTCUT_KEYS.moveToTrash, { shiftKey: true } );

		expect( h.onMarkAsSpam ).toHaveBeenCalledTimes( 1 );
		expect( h.onMoveToTrash ).toHaveBeenCalledTimes( 1 );
	} );

	it.each( [ [ 'metaKey' ], [ 'ctrlKey' ], [ 'altKey' ] ] )(
		'ignores keys held with %s',
		modifier => {
			const h = setup();

			press( SHORTCUT_KEYS.next, { [ modifier ]: true } );

			expect( h.onNext ).not.toHaveBeenCalled();
		}
	);

	it( 'does nothing while a shortcut is suspended', () => {
		const h = setup( { isDisabled: true } );

		press( SHORTCUT_KEYS.markAsSpam );

		expect( h.onMarkAsSpam ).not.toHaveBeenCalled();
	} );

	// A missing handler is how the page unbinds a key it cannot honour — at the ends
	// of the list, or while the record on screen isn't the one the URL names.
	it( 'leaves a key unbound when its handler is absent', () => {
		renderHook( () => useResponseKeyboardShortcuts( { onNext: undefined } ) );

		expect( press( SHORTCUT_KEYS.next ).defaultPrevented ).toBe( false );
	} );

	it( 'only preventDefaults keys it actually handles', () => {
		setup();

		expect( press( SHORTCUT_KEYS.next ).defaultPrevented ).toBe( true );
		expect( press( 'x' ).defaultPrevented ).toBe( false );
	} );

	// Escape is the one binding that collides with the rest of the UI: it also
	// dismisses the actions menu, the file preview and the confirmation dialog.
	// Whenever any of those is showing, the page reports `isDisabled` — without that,
	// dismissing one would navigate off the response as a side effect.
	describe( 'Escape', () => {
		it( 'backs out to the list', () => {
			const h = setup();

			press( 'Escape' );

			expect( h.onGoToList ).toHaveBeenCalledTimes( 1 );
		} );

		it( 'is suspended while something dismissible is open', () => {
			const h = setup( { isDisabled: true } );

			press( 'Escape' );

			expect( h.onGoToList ).not.toHaveBeenCalled();
		} );

		// Whatever opened the overlay is entitled to consume the key first.
		it( 'defers to a handler that already claimed the event', () => {
			const h = setup();

			const event = new KeyboardEvent( 'keydown', {
				key: 'Escape',
				bubbles: true,
				cancelable: true,
			} );
			event.preventDefault();
			window.dispatchEvent( event );

			expect( h.onGoToList ).not.toHaveBeenCalled();
		} );
	} );

	it( 'ignores keys typed into a field', () => {
		const h = setup();

		const input = document.createElement( 'input' );
		document.body.appendChild( input );
		input.dispatchEvent(
			new KeyboardEvent( 'keydown', { key: SHORTCUT_KEYS.markAsSpam, bubbles: true } )
		);

		expect( h.onMarkAsSpam ).not.toHaveBeenCalled();
		input.remove();
	} );

	// The labels are produced on demand rather than at module scope: `__()` called
	// while the module loads runs before locale data is necessarily installed, which
	// would bake the untranslated string in for the whole session.
	describe( 'getShortcutLabel', () => {
		it.each( [ [ 'next' ], [ 'previous' ], [ 'markAsSpam' ], [ 'moveToTrash' ] ] )(
			'labels %s with the key it binds',
			name => {
				expect( getShortcutLabel( name ) ).toBe( SHORTCUT_KEYS[ name ] );
			}
		);

		// Escape is the one key whose label differs from what is bound.
		it( 'spells Escape as "Esc" and keeps an accessible name', () => {
			expect( getShortcutLabel( 'goToList' ) ).toEqual( {
				display: 'Esc',
				ariaLabel: 'Escape',
			} );
		} );
	} );
} );
