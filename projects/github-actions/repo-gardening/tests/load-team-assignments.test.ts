import { jest } from '@jest/globals';
import type { TeamAssignment } from '../src/types.ts';

const mockGetInput = jest.fn< ( name: string ) => string >();

jest.unstable_mockModule( '@actions/core', () => ( {
	getInput: mockGetInput,
	setFailed: jest.fn(),
} ) );

const { loadTeamAssignments } = await import(
	'../src/tasks/triage-issues/update-board.ts'
);

describe( 'loadTeamAssignments', () => {
	beforeEach( () => {
		mockGetInput.mockReset();
	} );

	test( 'returns an empty mapping when none is configured', async () => {
		mockGetInput.mockReturnValue( '' );

		await expect( loadTeamAssignments() ).resolves.toEqual( {} );
		expect( mockGetInput ).toHaveBeenCalledWith( 'labels_team_assignments' );
	} );

	test( 'loads a repository-specific mapping', async () => {
		const assignments: Record< string, TeamAssignment > = {
			'AI Tools': {
				team: 'Korvax',
				labels: [ '[Feature] AI Tools' ],
			},
		};
		mockGetInput.mockReturnValue( JSON.stringify( assignments ) );

		await expect( loadTeamAssignments() ).resolves.toEqual( assignments );
	} );

	test( 'rejects a mapping without a team', async () => {
		mockGetInput.mockReturnValue(
			JSON.stringify( {
				'AI Tools': {
					labels: [ '[Feature] AI Tools' ],
				},
			} )
		);

		await expect( loadTeamAssignments() ).resolves.toEqual( {} );
	} );
} );
