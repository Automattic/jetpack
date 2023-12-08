import { jest } from '@jest/globals';
import { act } from '@testing-library/react';

/**
 * Simulate the passage of time.
 *
 * @param {number} seconds - The number of seconds to wait.
 */
export const wait = async ( seconds: number ) => {
	// Advance every second with a distinct act() call.
	// This ensures that re-render opportunities are triggered.
	for ( let i = 0; i < seconds; i++ ) {
		await act( async () => {
			jest.advanceTimersByTime( 1000 );
		} );
	}
};
