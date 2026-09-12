import fs from 'fs/promises';
import os from 'os';
import npath from 'path';
import { execa } from 'execa';
import { batchLockFileStatus } from '../../../helpers/install.js';

// Runs against a throwaway monorepo-shaped git repo, since the set is derived from git plus disk.
describe( 'batchLockFileStatus', () => {
	const SLUG = 'plugins/thing';
	let dir, cwd;

	const lockPath = () => npath.join( dir, 'projects', SLUG, 'composer.lock' );
	const git = ( ...args ) => execa( 'git', args, { cwd: dir } );

	beforeEach( async () => {
		cwd = process.cwd();
		dir = await fs.realpath( await fs.mkdtemp( npath.join( os.tmpdir(), 'jp-locks-' ) ) );
		await fs.mkdir( npath.dirname( lockPath() ), { recursive: true } );
		await fs.writeFile( lockPath(), '{}' );
		await git( 'init', '-q' );
		await git( '-c', 'user.email=t@t', '-c', 'user.name=t', 'add', '-A' );
		await git( '-c', 'user.email=t@t', '-c', 'user.name=t', 'commit', '-qm', 'lock' );
		process.chdir( dir );
	} );
	afterEach( async () => {
		process.chdir( cwd );
		await fs.rm( dir, { recursive: true, force: true } );
	} );

	test( 'reports a committed lock that is present on disk', async () => {
		expect( [ ...( await batchLockFileStatus() ) ] ).toEqual( [ SLUG ] );
	} );

	test( 'omits a committed lock that has been deleted from disk', async () => {
		// `jetpack clean <plugin> composer.lock` does this; `composer install` would then fail.
		await fs.rm( lockPath() );
		expect( [ ...( await batchLockFileStatus() ) ] ).toEqual( [] );
	} );
} );
