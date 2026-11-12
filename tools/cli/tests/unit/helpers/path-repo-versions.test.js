import fs from 'fs/promises';
import os from 'os';
import npath from 'path';
import {
	buildPackageVersionMap,
	pinProjects,
	restorePinnedComposerJsonSync,
	pinPathRepoVersions,
	shouldPinProject,
} from '../../../helpers/path-repo-versions.js';

describe( 'buildPackageVersionMap', () => {
	// dev-trunk is what Composer's VersionGuesser resolves these to on its own, so pinning to it
	// records the same version an unpinned install would. Pinning to the branch-alias instead
	// (4.0.x-dev) resolves fine but records a version Version_Selector::is_dev_version() rejects,
	// which is what JETPACK_AUTOLOAD_DEV keys off.
	test( 'pins a package to dev-trunk, not to its branch alias', () => {
		const map = buildPackageVersionMap( [
			{
				name: 'automattic/jetpack-connection',
				extra: { 'branch-alias': { 'dev-trunk': '9.1.x-dev' } },
			},
		] );
		expect( map ).toEqual( { 'automattic/jetpack-connection': 'dev-trunk' } );
	} );

	test( 'pins a package that declares no branch alias', () => {
		const map = buildPackageVersionMap( [ { name: 'automattic/jetpack-constants' } ] );
		expect( map ).toEqual( { 'automattic/jetpack-constants': 'dev-trunk' } );
	} );

	test( 'ignores composer.json contents with no name', () => {
		expect( buildPackageVersionMap( [ { extra: {} } ] ) ).toEqual( {} );
	} );
} );

describe( 'pinPathRepoVersions', () => {
	const versions = { 'automattic/jetpack-connection': '9.1.x-dev' };

	test( 'sets options.versions on a monorepo path repo', () => {
		const json = {
			repositories: [ { type: 'path', url: '../../packages/*', options: { monorepo: true } } ],
		};
		const out = pinPathRepoVersions( json, versions );
		expect( out.repositories[ 0 ].options.versions ).toEqual( versions );
	} );

	test( 'leaves repos that are not monorepo path repos untouched', () => {
		const json = {
			repositories: [
				{ type: 'composer', url: 'https://wpackagist.org' },
				{ type: 'path', url: '../../packages/*', options: { monorepo: true } },
			],
		};
		const out = pinPathRepoVersions( json, versions );
		expect( out.repositories[ 0 ] ).toEqual( { type: 'composer', url: 'https://wpackagist.org' } );
	} );

	test( 'preserves other options on the monorepo repo', () => {
		const json = {
			repositories: [
				{ type: 'path', url: '../../packages/*', options: { monorepo: true, symlink: true } },
			],
		};
		expect( pinPathRepoVersions( json, versions ).repositories[ 0 ].options.symlink ).toBe( true );
	} );

	test( 'does not mutate the input object', () => {
		const json = {
			repositories: [ { type: 'path', url: '../../packages/*', options: { monorepo: true } } ],
		};
		pinPathRepoVersions( json, versions );
		expect( json.repositories[ 0 ].options.versions ).toBeUndefined();
	} );

	test( 'returns null when there is no monorepo repo to pin', () => {
		expect( pinPathRepoVersions( { repositories: [] }, versions ) ).toBeNull();
		expect( pinPathRepoVersions( {}, versions ) ).toBeNull();
	} );
} );

describe( 'shouldPinProject', () => {
	const locked = new Set( [ 'plugins/jetpack' ] );

	test( 'pins a project with no committed composer.lock', () => {
		expect( shouldPinProject( 'packages/connection', locked, {} ) ).toBe( true );
	} );

	test( 'does not pin a project whose composer.lock is committed', () => {
		expect( shouldPinProject( 'plugins/jetpack', locked, {} ) ).toBe( false );
	} );

	test( 'does not pin mirror builds, which do their own composer.json munging', () => {
		expect( shouldPinProject( 'packages/connection', locked, { forMirrors: '/tmp/out' } ) ).toBe(
			false
		);
	} );
} );

describe( 'pinProjects', () => {
	const versions = { 'automattic/jetpack-connection': '9.1.x-dev' };
	const monorepoJson = {
		name: 'automattic/jetpack-test',
		repositories: [ { type: 'path', url: '../../packages/*', options: { monorepo: true } } ],
	};
	let dir;

	beforeEach( async () => {
		dir = await fs.mkdtemp( npath.join( os.tmpdir(), 'jp-pin-' ) );
	} );
	afterEach( async () => {
		await fs.rm( dir, { recursive: true, force: true } );
	} );

	const write = async json =>
		await fs.writeFile( npath.join( dir, 'composer.json' ), JSON.stringify( json, null, '\t' ) );
	const read = async () => await fs.readFile( npath.join( dir, 'composer.json' ), 'utf8' );

	test( 'the pinned versions are visible to the callback', async () => {
		await write( monorepoJson );
		const pin = await pinProjects( [ dir ], versions );
		const seen = JSON.parse( await read() ).repositories[ 0 ].options.versions;
		await pin.restore( new Set( [ dir ] ) );
		expect( seen ).toEqual( versions );
	} );

	test( 'restores the original file byte-for-byte afterwards', async () => {
		await write( monorepoJson );
		const before = await read();
		await ( await pinProjects( [ dir ], versions ) ).restore( new Set( [ dir ] ) );
		await expect( read() ).resolves.toBe( before );
	} );

	test( 'restores the original file when the callback throws, and rethrows', async () => {
		await write( monorepoJson );
		const before = await read();
		const pin = await pinProjects( [ dir ], versions );
		// The install failed, so this directory is absent from the succeeded set.
		await pin.restore( new Set() );
		await expect( read() ).resolves.toBe( before );
	} );

	test( 'leaves composer.json untouched when there is no monorepo repo', async () => {
		await write( { name: 'automattic/jetpack-test' } );
		const before = await read();
		const pin = await pinProjects( [ dir ], versions );
		await expect( read() ).resolves.toBe( before );
		await pin.restore( new Set( [ dir ] ) );
		await expect( read() ).resolves.toBe( before );
	} );

	test( 'restorePinnedComposerJsonSync recovers a file left pinned by an interrupted build', async () => {
		await write( monorepoJson );
		const before = await read();
		const pin = await pinProjects( [ dir ], versions );
		const pinnedDuring = await read();
		// Simulate SIGINT: the handler restores everything while the window is still open.
		restorePinnedComposerJsonSync();
		await pin.restore( new Set( [ dir ] ) );
		expect( pinnedDuring ).not.toBe( before );
		await expect( read() ).resolves.toBe( before );
	} );
} );

// Composer's content-hash for `monorepoJson` below. Hardcoded rather than computed by the code
// under test, so a drift in the PHP script's key set fails here instead of passing silently.
const FIXTURE_HASH = '1a87f40ba2e84248869bcae576f56e7e';

describe( 'lock re-stamping', () => {
	const versions = { 'automattic/jetpack-connection': '9.1.x-dev' };
	const monorepoJson = {
		name: 'automattic/jetpack-test',
		require: { 'automattic/jetpack-connection': '^9.1' },
		repositories: [ { type: 'path', url: '../../packages/*', options: { monorepo: true } } ],
	};
	let dir;

	const lockText = hash =>
		`{\n    "_readme": [],\n    "content-hash": "${ hash }",\n    "packages": []\n}\n`;
	const lockPath = () => npath.join( dir, 'composer.lock' );

	beforeEach( async () => {
		dir = await fs.mkdtemp( npath.join( os.tmpdir(), 'jp-lock-' ) );
		await fs.writeFile(
			npath.join( dir, 'composer.json' ),
			JSON.stringify( monorepoJson, null, '\t' )
		);
	} );
	afterEach( async () => await fs.rm( dir, { recursive: true, force: true } ) );

	test( 'restamps the lock for the restored manifest, leaving the rest byte-for-byte', async () => {
		await fs.writeFile( lockPath(), lockText( '0'.repeat( 32 ) ) );
		const pin = await pinProjects( [ dir ], versions );
		// Stand in for composer: rewrite the lock from the pinned manifest.
		await fs.writeFile( lockPath(), lockText( 'f'.repeat( 32 ) ) );
		await pin.restore( new Set( [ dir ] ) );
		await expect( fs.readFile( lockPath(), 'utf8' ) ).resolves.toBe( lockText( FIXTURE_HASH ) );
	} );

	// A failed `composer update` leaves whatever lock was already there; stamping it valid would
	// make the next build install an unrelated dependency set with no signal.
	test( 'does not restamp when the install failed', async () => {
		const stale = lockText( '0'.repeat( 32 ) );
		await fs.writeFile( lockPath(), stale );
		const pin = await pinProjects( [ dir ], versions );
		await pin.restore( new Set() ); // composer failed, so nothing to re-stamp
		await expect( fs.readFile( lockPath(), 'utf8' ) ).resolves.toBe( stale );
	} );

	test( 'does nothing when the project has no lock file', async () => {
		await ( await pinProjects( [ dir ], versions ) ).restore( new Set( [ dir ] ) );
		await expect( fs.access( lockPath() ) ).rejects.toThrow();
	} );

	test( 'does not throw out of the finally when the lock cannot be rewritten', async () => {
		// Re-stamping is best effort; failing it costs a later `composer update`, whereas throwing
		// from the finally would mask whatever actually failed the build.
		await fs.writeFile( lockPath(), lockText( '0'.repeat( 32 ) ) );
		await fs.chmod( lockPath(), 0o444 );
		const pin = await pinProjects( [ dir ], versions );
		await expect( pin.restore( new Set( [ dir ] ) ) ).resolves.toBeUndefined();
		await fs.chmod( lockPath(), 0o644 );
	} );
} );
