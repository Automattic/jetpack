import path from 'path';
import { jest } from '@jest/globals';

const mockSpawnSync = jest.fn();
jest.unstable_mockModule( 'child_process', () => ( {
	default: { spawnSync: mockSpawnSync },
	spawnSync: mockSpawnSync,
} ) );

const { getHooksDir } = await import( '../../../commands/draft.js' );

describe( 'getHooksDir', () => {
	afterEach( () => {
		mockSpawnSync.mockReset();
	} );

	test( 'returns core.hooksPath when set', () => {
		mockSpawnSync.mockReturnValueOnce( {
			stdout: '.husky',
			status: 0,
		} );

		const result = getHooksDir();
		expect( result ).toBe( path.resolve( process.cwd(), '.husky' ) );
		expect( mockSpawnSync ).toHaveBeenCalledTimes( 1 );
		expect( mockSpawnSync ).toHaveBeenCalledWith( 'git', [ 'config', 'core.hooksPath' ], {
			encoding: 'utf8',
		} );
	} );

	test( 'falls back to git rev-parse --git-path hooks when core.hooksPath is unset', () => {
		mockSpawnSync
			.mockReturnValueOnce( {
				stdout: '',
				status: 1,
			} )
			.mockReturnValueOnce( {
				stdout: '.git/hooks',
				status: 0,
			} );

		const result = getHooksDir();
		expect( result ).toBe( path.resolve( process.cwd(), '.git/hooks' ) );
		expect( mockSpawnSync ).toHaveBeenCalledTimes( 2 );
		expect( mockSpawnSync ).toHaveBeenNthCalledWith(
			2,
			'git',
			[ 'rev-parse', '--git-path', 'hooks' ],
			{ encoding: 'utf8' }
		);
	} );

	test( 'falls back to .git/hooks when both git commands fail', () => {
		mockSpawnSync
			.mockReturnValueOnce( {
				stdout: '',
				status: 1,
			} )
			.mockReturnValueOnce( {
				stdout: '',
				status: 1,
			} );

		const result = getHooksDir();
		expect( result ).toBe( path.join( process.cwd(), '.git', 'hooks' ) );
		expect( mockSpawnSync ).toHaveBeenCalledTimes( 2 );
	} );

	test( 'resolves absolute core.hooksPath as-is', () => {
		mockSpawnSync.mockReturnValueOnce( {
			stdout: '/opt/git-hooks',
			status: 0,
		} );

		const result = getHooksDir();
		expect( result ).toBe( '/opt/git-hooks' );
	} );

	test( 'handles worktree hooks path from rev-parse', () => {
		mockSpawnSync
			.mockReturnValueOnce( {
				stdout: '',
				status: 1,
			} )
			.mockReturnValueOnce( {
				stdout: '../.git/worktrees/my-branch/hooks',
				status: 0,
			} );

		const result = getHooksDir();
		expect( result ).toBe( path.resolve( process.cwd(), '../.git/worktrees/my-branch/hooks' ) );
	} );
} );
