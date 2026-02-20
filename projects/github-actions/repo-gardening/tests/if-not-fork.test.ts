import { jest } from '@jest/globals';
import ifNotFork from '../src/utils/if-not-fork.ts';
import type { OctokitClient, PullRequestEvent } from '../src/types.ts';

describe( 'ifNotFork', () => {
	const mockOctokit = {} as OctokitClient;
	const mockHandler = jest.fn();

	/**
	 * Create a minimal PullRequestEvent payload for fork detection.
	 *
	 * @param headRepoFullName - Full name of the head repo, or null.
	 * @param baseRepoFullName - Full name of the base repo.
	 * @return Mock payload.
	 */
	function makePayload(
		headRepoFullName: string | null,
		baseRepoFullName: string
	): PullRequestEvent {
		return {
			pull_request: {
				head: { repo: headRepoFullName ? { full_name: headRepoFullName } : null },
				base: { repo: { full_name: baseRepoFullName } },
			},
		} as unknown as PullRequestEvent;
	}

	beforeEach( () => {
		mockHandler.mockClear();
	} );

	test( 'calls handler when head and base repos match (not a fork)', () => {
		const wrapped = ifNotFork( mockHandler );
		wrapped( makePayload( 'owner/repo', 'owner/repo' ), mockOctokit );
		expect( mockHandler ).toHaveBeenCalledTimes( 1 );
	} );

	test( 'does not call handler when repos differ (is a fork)', () => {
		const wrapped = ifNotFork( mockHandler );
		wrapped( makePayload( 'forker/repo', 'owner/repo' ), mockOctokit );
		expect( mockHandler ).not.toHaveBeenCalled();
	} );

	test( 'does not call handler when head repo is null', () => {
		const wrapped = ifNotFork( mockHandler );
		wrapped( makePayload( null, 'owner/repo' ), mockOctokit );
		expect( mockHandler ).not.toHaveBeenCalled();
	} );

	test( 'preserves the original handler name', () => {
		/**
		 * Stub task function.
		 */
		function myTaskName() {}
		const wrapped = ifNotFork( myTaskName );
		expect( wrapped.name ).toBe( 'myTaskName' );
	} );
} );
