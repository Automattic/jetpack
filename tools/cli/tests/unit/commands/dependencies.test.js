import { fileURLToPath } from 'url';
import { jest } from '@jest/globals';
import { handler } from '../../../commands/dependencies.js';

const oldCwd = process.cwd();
beforeAll( () =>
	process.chdir( fileURLToPath( new URL( '../../data/monorepo-dev-edges', import.meta.url ) ) )
);
afterEach( () => jest.restoreAllMocks() );
afterAll( () => process.chdir( oldCwd ) );

// packages/a require-devs packages/x, packages/b requires packages/a.
describe( 'dependencies list --add-dependents', () => {
	test.each( [
		[ true, [ 'packages/a', 'packages/x' ] ],
		[ false, [ 'packages/a', 'packages/b', 'packages/x' ] ],
	] )( '--only-direct-dev-dependents=%s', async ( onlyDirectDevDependents, expected ) => {
		const log = jest.spyOn( console, 'log' ).mockImplementation( () => {} );
		await handler( {
			subcommand: 'list',
			projects: [ 'packages/x' ],
			addDependents: true,
			onlyDirectDevDependents,
			extra: 'test',
		} );
		expect( log.mock.calls[ 0 ][ 0 ].split( '\n' ).sort() ).toEqual( expected );
	} );
} );
