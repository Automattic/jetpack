import { fileURLToPath } from 'url';
import { jest } from '@jest/globals';
import { handler } from '../../../commands/dependencies.js';

const oldCwd = process.cwd();
beforeAll( () =>
	process.chdir( fileURLToPath( new URL( '../../data/monorepo-dev-edges', import.meta.url ) ) )
);
afterAll( () => process.chdir( oldCwd ) );

// packages/a require-devs packages/x, packages/b requires packages/a.
describe( 'dependencies list --add-dependents', () => {
	test.each( [
		[ 'test', [ 'packages/a', 'packages/x' ] ],
		[ 'build', [ 'packages/a', 'packages/b', 'packages/x' ] ],
		[ undefined, [ 'packages/a', 'packages/b', 'packages/x' ] ],
	] )( '--extra=%s', async ( extra, expected ) => {
		const log = jest.spyOn( console, 'log' ).mockImplementation( () => {} );
		await handler( {
			subcommand: 'list',
			projects: [ 'packages/x' ],
			addDependents: true,
			extra,
		} );
		expect( log.mock.calls[ 0 ][ 0 ].split( '\n' ).sort() ).toEqual( expected );
		log.mockRestore();
	} );
} );
