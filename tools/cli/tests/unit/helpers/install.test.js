import fs from 'fs/promises';
import os from 'os';
import npath from 'path';
import { execa } from 'execa';
import { batchLockFileStatus, getInstallArgs } from '../../../helpers/install.js';

// Runs against a throwaway monorepo-shaped git repo, since the set is derived from git.
describe( 'composer.lock handling', () => {
	const SLUG = 'plugins/thing';
	let dir, cwd;

	const lockPath = () => npath.join( dir, 'projects', SLUG, 'composer.lock' );
	const git = ( ...args ) =>
		execa( 'git', [ '-c', 'user.email=t@t', '-c', 'user.name=t', ...args ], { cwd: dir } );

	beforeEach( async () => {
		cwd = process.cwd();
		dir = await fs.realpath( await fs.mkdtemp( npath.join( os.tmpdir(), 'jp-locks-' ) ) );
		await fs.mkdir( npath.dirname( lockPath() ), { recursive: true } );
		await fs.writeFile( lockPath(), '{}' );
		await git( 'init', '-q' );
		await git( 'add', '-A' );
		await git( 'commit', '-qm', 'lock' );
		process.chdir( dir );
	} );
	afterEach( async () => {
		process.chdir( cwd );
		await fs.rm( dir, { recursive: true, force: true } );
	} );

	test( 'batchLockFileStatus reports a project whose lock is committed', async () => {
		expect( [ ...( await batchLockFileStatus() ) ] ).toEqual( [ SLUG ] );
	} );

	// The set answers "is this lock tracked", which is also what decides whether pinning may
	// rewrite it. Deleting the file locally must not make it look untracked.
	test( 'batchLockFileStatus still reports it when the file is deleted locally', async () => {
		await fs.rm( lockPath() );
		expect( [ ...( await batchLockFileStatus() ) ] ).toEqual( [ SLUG ] );
	} );

	test( 'installs from a committed lock that is present on disk', async () => {
		await expect( getInstallArgs( SLUG, 'composer', {}, new Set( [ SLUG ] ) ) ).resolves.toEqual( [
			'install',
		] );
	} );

	// `jetpack clean <plugin> composer.lock` does this; `composer install` would then fail.
	test( 'updates when a committed lock has been deleted from disk', async () => {
		await fs.rm( lockPath() );
		await expect( getInstallArgs( SLUG, 'composer', {}, new Set( [ SLUG ] ) ) ).resolves.toEqual( [
			'update',
		] );
	} );
} );
