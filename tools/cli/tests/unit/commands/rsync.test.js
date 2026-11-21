import fs from 'fs/promises';
import os from 'os';
import path from 'path';
import { jest } from '@jest/globals';
import { execa } from 'execa';

jest.unstable_mockModule( 'configstore', () => ( { default: class {} } ) );

const { getRshOption, getUnbuiltProjects } = await import( '../../../commands/rsync.js' );

const passwordOpts = '-o NumberOfPasswordPrompts=1 -o PubkeyAuthentication=no';

describe( 'getRshOption', () => {
	test.each( [
		[ 'no password', null, {}, null ],
		[ 'no password, with RSYNC_RSH', null, { RSYNC_RSH: 'ssh -p 2222' }, null ],
		[ 'password', 'secret', {}, `--rsh=ssh ${ passwordOpts }` ],
		[
			'password, with RSYNC_RSH',
			'secret',
			{ RSYNC_RSH: 'ssh -p 2222' },
			`--rsh=ssh -p 2222 ${ passwordOpts }`,
		],
	] )( '%s', ( _, password, env, expected ) => {
		expect( getRshOption( password, env ) ).toBe( expected );
	} );

	test( 'uses the SSH proxy when RSYNC_PROXY_SOCKET is set', () => {
		expect( getRshOption( null, { RSYNC_PROXY_SOCKET: '/sock' } ) ).toMatch(
			/^--rsh=\/.*\/tools\/docker\/bin\/rsync-rsh-proxy\.sh$/
		);
	} );
} );

describe( 'getUnbuiltProjects', () => {
	let repo;

	beforeAll( async () => {
		repo = await fs.mkdtemp( path.join( os.tmpdir(), 'rsync-unbuilt-' ) );
		await execa( 'git', [ 'init', '-q' ], { cwd: repo } );
	} );

	afterAll( async () => {
		await fs.rm( repo, { recursive: true, force: true } );
	} );

	test.each( [
		[ 'built', { 'build-production': 'x' }, true, false ],
		[ 'unbuilt', { 'build-production': 'x' }, false, true ],
		[ 'unbuilt with composer vendor', { 'build-production': 'x' }, false, true, true ],
		[ 'no build step', {}, false, false ],
		[ 'no production-include rule', { 'build-production': 'x' }, false, false, false, '' ],
	] )( '%s', async ( name, scripts, hasBuild, expected, hasVendor = false, attributes = null ) => {
		const project = path.join( repo, name.replace( / /g, '-' ) );
		await fs.mkdir( project );
		await fs.writeFile( path.join( project, 'composer.json' ), JSON.stringify( { scripts } ) );
		await fs.writeFile( path.join( project, '.gitignore' ), '/build/\n/vendor/\n' );
		await fs.writeFile(
			path.join( project, '.gitattributes' ),
			attributes ?? '/build/** production-include\n/vendor/** production-include\n'
		);
		if ( hasVendor ) {
			await fs.mkdir( path.join( project, 'vendor' ) );
			await fs.writeFile( path.join( project, 'vendor', 'autoload.php' ), '' );
		}
		if ( hasBuild ) {
			await fs.mkdir( path.join( project, 'build' ) );
			await fs.writeFile( path.join( project, 'build', 'index.js' ), '' );
		}
		await expect( getUnbuiltProjects( [ project ] ) ).resolves.toEqual(
			expected ? [ project ] : []
		);
	} );
} );
