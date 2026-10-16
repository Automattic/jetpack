/**
 * External dependencies
 */
import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals';
import { act, renderHook } from '@testing-library/react';

// Capture the onCopy callback passed to useCopyToClipboard so the test can fire it,
// simulating a successful clipboard copy.
let capturedOnCopy;
await jest.unstable_mockModule( '@wordpress/compose', () => ( {
	useCopyToClipboard: jest.fn( ( _text, onCopy ) => {
		capturedOnCopy = onCopy;
		return jest.fn(); // the ref callback; irrelevant to this hook's logic
	} ),
} ) );

const { default: useCopyConfirmation } = await import( '../../../src/hooks/use-copy-confirmation' );

describe( 'useCopyConfirmation', () => {
	beforeEach( () => {
		jest.useFakeTimers();
		capturedOnCopy = undefined;
	} );

	afterEach( () => {
		jest.runOnlyPendingTimers();
		jest.useRealTimers();
	} );

	it( 'starts not copied and exposes a ref', () => {
		const { result } = renderHook( () => useCopyConfirmation( 'hello' ) );

		expect( result.current.copied ).toBe( false );
		expect( result.current.ref ).toBeDefined();
	} );

	it( 'flips copied to true on copy and resets after the given delay', () => {
		const { result } = renderHook( () => useCopyConfirmation( 'hello', 2000 ) );

		act( () => capturedOnCopy() );
		expect( result.current.copied ).toBe( true );

		act( () => jest.advanceTimersByTime( 2000 ) );
		expect( result.current.copied ).toBe( false );
	} );

	it( 'defaults the reset delay to 4000ms', () => {
		const { result } = renderHook( () => useCopyConfirmation( 'hello' ) );

		act( () => capturedOnCopy() );

		act( () => jest.advanceTimersByTime( 3999 ) );
		expect( result.current.copied ).toBe( true );

		act( () => jest.advanceTimersByTime( 1 ) );
		expect( result.current.copied ).toBe( false );
	} );

	it( 'restarts the reset timer when copied again before it elapses', () => {
		const { result } = renderHook( () => useCopyConfirmation( 'hello', 2000 ) );

		act( () => capturedOnCopy() );
		act( () => jest.advanceTimersByTime( 1000 ) );

		// Copy again half-way through: the pending reset should be cleared and restarted.
		act( () => capturedOnCopy() );
		act( () => jest.advanceTimersByTime( 1000 ) );
		expect( result.current.copied ).toBe( true );

		act( () => jest.advanceTimersByTime( 1000 ) );
		expect( result.current.copied ).toBe( false );
	} );

	it( 'clears the pending timeout — with its own timer id — on unmount', () => {
		const setSpy = jest.spyOn( globalThis, 'setTimeout' );
		const clearSpy = jest.spyOn( globalThis, 'clearTimeout' );
		const { unmount } = renderHook( () => useCopyConfirmation( 'hello', 2000 ) );

		act( () => capturedOnCopy() );

		// The hook's reset timer is the one scheduled with the resetMs delay.
		const scheduled = setSpy.mock.calls.findIndex( ( [ , delay ] ) => delay === 2000 );
		const timerId = setSpy.mock.results[ scheduled ].value;

		unmount();

		expect( clearSpy ).toHaveBeenCalledWith( timerId );
		setSpy.mockRestore();
		clearSpy.mockRestore();
	} );
} );
