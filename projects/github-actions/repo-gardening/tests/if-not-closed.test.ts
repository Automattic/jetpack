import { jest } from '@jest/globals';
import ifNotClosed from '../src/utils/if-not-closed.ts';
import type { OctokitClient, PullRequestEvent } from '../src/types.ts';

describe( 'ifNotClosed', () => {
	const mockOctokit = {} as OctokitClient;
	const mockHandler = jest.fn();

	/**
	 * Create a minimal PullRequestEvent payload with the given PR state.
	 *
	 * @param state - The pull request state.
	 * @return Mock payload.
	 */
	function makePayload( state: string ): PullRequestEvent {
		return {
			pull_request: { state },
		} as unknown as PullRequestEvent;
	}

	beforeEach( () => {
		mockHandler.mockClear();
	} );

	test( 'calls handler when PR is open', () => {
		const wrapped = ifNotClosed( mockHandler );
		wrapped( makePayload( 'open' ), mockOctokit );
		expect( mockHandler ).toHaveBeenCalledTimes( 1 );
	} );

	test( 'does not call handler when PR is closed', () => {
		const wrapped = ifNotClosed( mockHandler );
		wrapped( makePayload( 'closed' ), mockOctokit );
		expect( mockHandler ).not.toHaveBeenCalled();
	} );

	test( 'preserves the original handler name', () => {
		/**
		 * Stub task function.
		 */
		function myTaskName() {}
		const wrapped = ifNotClosed( myTaskName );
		expect( wrapped.name ).toBe( 'myTaskName' );
	} );

	test( 'returns the handler result when not closed', () => {
		const handler = jest.fn().mockReturnValue( 'result' );
		const wrapped = ifNotClosed( handler );
		const result = wrapped( makePayload( 'open' ), mockOctokit );
		expect( result ).toBe( 'result' );
	} );

	test( 'returns undefined when closed', () => {
		const wrapped = ifNotClosed( mockHandler );
		const result = wrapped( makePayload( 'closed' ), mockOctokit );
		expect( result ).toBeUndefined();
	} );
} );
