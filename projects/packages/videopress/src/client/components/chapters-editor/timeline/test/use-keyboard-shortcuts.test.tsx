/* eslint-disable testing-library/prefer-user-event -- The hook listens for raw keydowns on document; userEvent routes keys through the focused element with its own key-handling semantics. */
import { fireEvent, renderHook } from '@testing-library/react';
import { useKeyboardShortcuts } from '../use-keyboard-shortcuts';
import type { KeyboardShortcuts } from '../use-keyboard-shortcuts';

/**
 * Mount the hook with spy callbacks.
 *
 * @param overrides - Option overrides for this test.
 * @return The spies plus the renderHook handle.
 */
function mountShortcuts( overrides: Partial< KeyboardShortcuts > = {} ) {
	const spies = {
		onTogglePlay: jest.fn(),
		onNudge: jest.fn(),
		onHome: jest.fn(),
		onEnd: jest.fn(),
		onRemoveSelected: jest.fn(),
		onUndo: jest.fn(),
		onRedo: jest.fn(),
	};
	const view = renderHook( () => useKeyboardShortcuts( { ...spies, ...overrides } ) );
	return { ...spies, ...view };
}

describe( 'useKeyboardShortcuts', () => {
	it( 'toggles playback on space', () => {
		const { onTogglePlay } = mountShortcuts();
		fireEvent.keyDown( document.body, { key: ' ' } );
		expect( onTogglePlay ).toHaveBeenCalledTimes( 1 );
	} );

	it( 'nudges ±100ms on arrows and ±1s with shift', () => {
		const { onNudge } = mountShortcuts();
		fireEvent.keyDown( document.body, { key: 'ArrowLeft' } );
		fireEvent.keyDown( document.body, { key: 'ArrowRight' } );
		fireEvent.keyDown( document.body, { key: 'ArrowLeft', shiftKey: true } );
		fireEvent.keyDown( document.body, { key: 'ArrowRight', shiftKey: true } );
		expect( onNudge.mock.calls ).toEqual( [ [ -100 ], [ 100 ], [ -1000 ], [ 1000 ] ] );
	} );

	it( 'jumps to the trim points on Home and End', () => {
		const { onHome, onEnd } = mountShortcuts();
		fireEvent.keyDown( document.body, { key: 'Home' } );
		fireEvent.keyDown( document.body, { key: 'End' } );
		expect( onHome ).toHaveBeenCalledTimes( 1 );
		expect( onEnd ).toHaveBeenCalledTimes( 1 );
	} );

	it( 'removes the selected cut on Delete and Backspace', () => {
		const { onRemoveSelected } = mountShortcuts();
		fireEvent.keyDown( document.body, { key: 'Delete' } );
		fireEvent.keyDown( document.body, { key: 'Backspace' } );
		expect( onRemoveSelected ).toHaveBeenCalledTimes( 2 );
	} );

	it( 'undoes on mod+Z and redoes on shift+mod+Z', () => {
		const { onUndo, onRedo } = mountShortcuts();
		fireEvent.keyDown( document.body, { key: 'z', ctrlKey: true } );
		fireEvent.keyDown( document.body, { key: 'Z', metaKey: true, shiftKey: true } );
		expect( onUndo ).toHaveBeenCalledTimes( 1 );
		expect( onRedo ).toHaveBeenCalledTimes( 1 );
	} );

	it( 'ignores plain keys with a modifier held', () => {
		const { onTogglePlay, onNudge } = mountShortcuts();
		fireEvent.keyDown( document.body, { key: ' ', ctrlKey: true } );
		fireEvent.keyDown( document.body, { key: 'ArrowRight', altKey: true } );
		expect( onTogglePlay ).not.toHaveBeenCalled();
		expect( onNudge ).not.toHaveBeenCalled();
	} );

	it( 'bails on editable targets', () => {
		const input = document.createElement( 'input' );
		document.body.appendChild( input );
		const { onTogglePlay, onNudge } = mountShortcuts();
		fireEvent.keyDown( input, { key: ' ' } );
		fireEvent.keyDown( input, { key: 'ArrowLeft' } );
		expect( onTogglePlay ).not.toHaveBeenCalled();
		expect( onNudge ).not.toHaveBeenCalled();
		input.remove();
	} );

	it( 'bails on focused interactive controls so keys activate them instead', () => {
		const button = document.createElement( 'button' );
		const icon = document.createElement( 'span' );
		button.appendChild( icon );
		const link = document.createElement( 'a' );
		link.setAttribute( 'href', '/library' );
		document.body.append( button, link );

		const { onTogglePlay, onRemoveSelected, onNudge } = mountShortcuts();
		fireEvent.keyDown( button, { key: ' ' } );
		fireEvent.keyDown( icon, { key: ' ' } );
		fireEvent.keyDown( button, { key: 'Delete' } );
		fireEvent.keyDown( link, { key: 'ArrowRight' } );

		expect( onTogglePlay ).not.toHaveBeenCalled();
		expect( onRemoveSelected ).not.toHaveBeenCalled();
		expect( onNudge ).not.toHaveBeenCalled();
		button.remove();
		link.remove();
	} );

	it( 'bails on already-handled events', () => {
		const { onTogglePlay } = mountShortcuts();
		const event = new KeyboardEvent( 'keydown', { key: ' ', cancelable: true, bubbles: true } );
		event.preventDefault();
		document.body.dispatchEvent( event );
		expect( onTogglePlay ).not.toHaveBeenCalled();
	} );

	it( 'stays detached while disabled', () => {
		const { onTogglePlay } = mountShortcuts( { enabled: false } );
		fireEvent.keyDown( document.body, { key: ' ' } );
		expect( onTogglePlay ).not.toHaveBeenCalled();
	} );

	it( 'detaches on unmount', () => {
		const { onTogglePlay, unmount } = mountShortcuts();
		unmount();
		fireEvent.keyDown( document.body, { key: ' ' } );
		expect( onTogglePlay ).not.toHaveBeenCalled();
	} );
} );
