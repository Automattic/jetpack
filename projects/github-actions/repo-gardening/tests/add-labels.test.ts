import { jest } from '@jest/globals';
import type { OctokitClient, PullRequestEvent } from '../src/types.ts';

// Provide a minimal @actions/core mock so getInput() doesn't throw.
jest.unstable_mockModule( '@actions/core', () => ( {
	getInput: jest.fn().mockReturnValue( '' ),
} ) );

// Mock getFiles to return a controllable file list.
const mockGetFiles = jest.fn< () => Promise< string[] | null > >();
jest.unstable_mockModule( '../src/utils/get-files.ts', () => ( {
	default: mockGetFiles,
} ) );

// Mock getLabels (labels already on the PR).
const mockGetLabels = jest.fn< () => Promise< string[] > >();
jest.unstable_mockModule( '../src/utils/labels/get-labels.ts', () => ( {
	default: mockGetLabels,
} ) );

// Mock getAvailableLabels (all labels that exist in the repo).
const mockGetAvailableLabels = jest.fn< () => Promise< Array< { name: string } > > >();
jest.unstable_mockModule( '../src/utils/labels/get-available-labels.ts', () => ( {
	default: mockGetAvailableLabels,
} ) );

// Import the module under test after all mocks are registered.
const { default: addLabels } = await import( '../src/tasks/add-labels/index.ts' );

/**
 * Build a minimal PullRequestEvent payload.
 *
 * @param headRepoFullName - Full name of the head repo (simulates fork when different from base).
 * @param baseRepoFullName - Full name of the base repo.
 * @return Mock payload.
 */
function makePayload( headRepoFullName: string, baseRepoFullName: string ): PullRequestEvent {
	return {
		number: 123,
		repository: {
			owner: { login: 'owner' },
			name: 'repo',
		},
		pull_request: {
			draft: false,
			title: 'Add a feature',
			head: { repo: { full_name: headRepoFullName } },
			base: { repo: { full_name: baseRepoFullName } },
		},
	} as unknown as PullRequestEvent;
}

describe( 'addLabels', () => {
	const mockAddLabels = jest.fn< () => Promise< void > >();
	const mockOctokit = {
		rest: {
			issues: {
				addLabels: mockAddLabels,
			},
		},
	} as unknown as OctokitClient;

	beforeEach( () => {
		mockGetFiles.mockReset();
		mockGetLabels.mockReset();
		mockGetAvailableLabels.mockReset();
		mockAddLabels.mockReset();

		// Defaults: PR has no existing labels, repo has no labels.
		mockGetLabels.mockResolvedValue( [] );
		mockGetAvailableLabels.mockResolvedValue( [] );
	} );

	test( 'non-fork PR: adds labels even if they do not exist in the repo yet', async () => {
		const payload = makePayload( 'owner/repo', 'owner/repo' );

		// A file under .github/workflows triggers the "Actions" label.
		mockGetFiles.mockResolvedValue( [ '.github/workflows/ci.yml' ] );

		await addLabels( payload, mockOctokit );

		expect( mockGetAvailableLabels ).not.toHaveBeenCalled();
		expect( mockAddLabels ).toHaveBeenCalledTimes( 1 );
		expect( mockAddLabels.mock.calls[ 0 ][ 0 ] ).toMatchObject( {
			labels: expect.arrayContaining( [ 'Actions' ] ),
		} );
	} );

	test( 'fork PR: only adds labels that already exist in the repo', async () => {
		const payload = makePayload( 'contributor/repo', 'owner/repo' );

		// File triggers "Actions" label.
		mockGetFiles.mockResolvedValue( [ '.github/workflows/ci.yml' ] );

		// Only "Actions" exists in the repo; other derived labels do not.
		mockGetAvailableLabels.mockResolvedValue( [ { name: 'Actions' } ] );

		await addLabels( payload, mockOctokit );

		expect( mockGetAvailableLabels ).toHaveBeenCalledTimes( 1 );
		expect( mockAddLabels ).toHaveBeenCalledTimes( 1 );
		expect( mockAddLabels.mock.calls[ 0 ][ 0 ] ).toMatchObject( {
			labels: [ 'Actions' ],
		} );
	} );

	test( 'fork PR: skips adding labels when none of the derived labels exist in the repo', async () => {
		const payload = makePayload( 'contributor/repo', 'owner/repo' );

		// File triggers "Actions" label, but it doesn't exist in the repo.
		mockGetFiles.mockResolvedValue( [ '.github/workflows/ci.yml' ] );
		mockGetAvailableLabels.mockResolvedValue( [] );

		await addLabels( payload, mockOctokit );

		expect( mockGetAvailableLabels ).toHaveBeenCalledTimes( 1 );
		expect( mockAddLabels ).not.toHaveBeenCalled();
	} );
} );
