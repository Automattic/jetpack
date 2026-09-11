import fs from 'fs/promises';
import os from 'os';
import npath from 'path';
import { getInstallArgs } from '../../../helpers/install.js';

// `projectDir` resolves against process.cwd(), so these run inside a throwaway monorepo-shaped tree.
describe( 'getInstallArgs composer lock handling', () => {
	const SLUG = 'plugins/thing';
	let dir, cwd;

	beforeEach( async () => {
		cwd = process.cwd();
		dir = await fs.mkdtemp( npath.join( os.tmpdir(), 'jp-install-' ) );
		await fs.mkdir( npath.join( dir, 'projects', SLUG ), { recursive: true } );
		process.chdir( dir );
	} );
	afterEach( async () => {
		process.chdir( cwd );
		await fs.rm( dir, { recursive: true, force: true } );
	} );

	const lockPath = () => npath.join( dir, 'projects', SLUG, 'composer.lock' );

	test( 'installs from a committed lock that is present on disk', async () => {
		await fs.writeFile( lockPath(), '{}' );
		await expect( getInstallArgs( SLUG, 'composer', {}, new Set( [ SLUG ] ) ) ).resolves.toEqual( [
			'install',
		] );
	} );

	test( 'updates when a committed lock has been deleted from disk', async () => {
		// `jetpack clean <plugin> composer.lock` does exactly this; `composer install` would fail.
		await expect( getInstallArgs( SLUG, 'composer', {}, new Set( [ SLUG ] ) ) ).resolves.toEqual( [
			'update',
		] );
	} );
} );
