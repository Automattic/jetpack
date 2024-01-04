import { jest } from '@jest/globals';
import { renderHook, act } from '@testing-library/react';
import { wait } from '../tests/utils';
import usePolling from './use-polling';

describe( 'usePolling', () => {
	let mockCallback: jest.Mock< () => Promise< void > >;

	beforeEach( () => {
		jest.useFakeTimers();
		jest.spyOn( global, 'setTimeout' );
		jest.spyOn( global, 'clearTimeout' );

		mockCallback = jest.fn( () => Promise.resolve() );
	} );

	afterEach( () => {
		jest.clearAllTimers();
		jest.restoreAllMocks();
	} );

	it( 'starts and stops polling', async () => {
		const { result } = renderHook( () => usePolling( { callback: mockCallback, interval: 1000 } ) );

		// Start polling
		await act( async () => {
			result.current.start();
		} );

		// Test that polling has started
		expect( result.current.isPolling ).toBe( true );
		expect( setTimeout ).toHaveBeenCalledTimes( 1 );
		expect( mockCallback ).toHaveBeenCalledTimes( 1 );

		// Stop polling
		await act( async () => {
			result.current.stop();
		} );

		// Test that polling has stopped
		expect( result.current.isPolling ).toBe( false );

		// Wait a few cycles to ensure polling has stopped...
		await wait( 5 );

		// Test that polling has not restarted
		expect( result.current.isPolling ).toBe( false );
		expect( mockCallback ).toHaveBeenCalledTimes( 1 );
	} );

	it( 'calls the callback at specified intervals', async () => {
		const { result } = renderHook( () => usePolling( { callback: mockCallback, interval: 1000 } ) );

		// Start polling
		await act( async () => {
			result.current.start();
		} );

		// Validate that the callback is executed immediately.
		expect( mockCallback ).toHaveBeenCalledTimes( 1 );

		// Wait 4 seconds.
		await wait( 4 );

		// Test that the callback has been called 4 more times.
		expect( mockCallback ).toHaveBeenCalledTimes( 5 );
	} );

	it( 'stops polling on synchronous error in callback', async () => {
		const errorMockCallback = jest.fn( () => {
			throw new Error( 'Sync Error' );
		} );
		const { result } = renderHook( () =>
			usePolling( { callback: errorMockCallback, handleCallbackError: () => false } )
		);

		await act( async () => {
			result.current.start();
		} );

		await wait( 5 );

		expect( result.current.isPolling ).toBe( false );
		expect( errorMockCallback ).toHaveBeenCalledTimes( 1 );
	} );

	it( 'stops polling on asynchronous error in callback', async () => {
		const asyncErrorMockCallback = jest.fn( () => Promise.reject( new Error( 'Async Error' ) ) );
		const { result } = renderHook( () =>
			usePolling( {
				callback: asyncErrorMockCallback,
				handleCallbackError: () => false,
			} )
		);

		await act( async () => {
			result.current.start();
		} );

		await wait( 5 );

		expect( result.current.isPolling ).toBe( false );
		expect( asyncErrorMockCallback ).toHaveBeenCalledTimes( 1 );
	} );

	it( 'stops polling when shouldStop returns true', async () => {
		const { result } = renderHook( () =>
			usePolling( {
				callback: mockCallback,
				handleCallbackResponse: () => false,
				interval: 1000,
			} )
		);

		await act( async () => {
			result.current.start();
		} );

		await wait( 5 );

		expect( result.current.isPolling ).toBe( false );
		expect( mockCallback ).toHaveBeenCalledTimes( 1 );
	} );

	it( 'stops polling and cleans up on unmount', async () => {
		const { result, unmount } = renderHook( () =>
			usePolling( { callback: mockCallback, interval: 1000 } )
		);

		await act( async () => {
			result.current.start();
		} );

		expect( mockCallback ).toHaveBeenCalledTimes( 1 );

		unmount();

		await wait( 5 );

		// Test that polling has not restarted
		expect( mockCallback ).toHaveBeenCalledTimes( 1 );
	} );
} );
