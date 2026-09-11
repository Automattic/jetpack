import fs from 'fs/promises';
import os from 'os';
import npath from 'path';
import {
	buildPackageVersionMap,
	withPinnedComposerJson,
	composerContentHash,
	restorePinnedComposerJsonSync,
	pinPathRepoVersions,
	shouldPinProject,
} from '../../../helpers/path-repo-versions.js';

describe( 'buildPackageVersionMap', () => {
	test( 'maps a package name to its dev-trunk branch alias', () => {
		const map = buildPackageVersionMap( [
			{
				name: 'automattic/jetpack-connection',
				extra: { 'branch-alias': { 'dev-trunk': '9.1.x-dev' } },
			},
		] );
		expect( map ).toEqual( { 'automattic/jetpack-connection': '9.1.x-dev' } );
	} );

	test( 'falls back to dev-trunk when a package declares no branch alias', () => {
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

describe( 'withPinnedComposerJson', () => {
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
		let seen;
		await withPinnedComposerJson( dir, versions, async () => {
			seen = JSON.parse( await read() ).repositories[ 0 ].options.versions;
		} );
		expect( seen ).toEqual( versions );
	} );

	test( 'restores the original file byte-for-byte afterwards', async () => {
		await write( monorepoJson );
		const before = await read();
		await withPinnedComposerJson( dir, versions, async () => {} );
		await expect( read() ).resolves.toBe( before );
	} );

	test( 'restores the original file when the callback throws, and rethrows', async () => {
		await write( monorepoJson );
		const before = await read();
		await expect(
			withPinnedComposerJson( dir, versions, async () => {
				throw new Error( 'composer blew up' );
			} )
		).rejects.toThrow( 'composer blew up' );
		await expect( read() ).resolves.toBe( before );
	} );

	test( 'leaves composer.json untouched when there is no monorepo repo', async () => {
		await write( { name: 'automattic/jetpack-test' } );
		const before = await read();
		let ran = false;
		await withPinnedComposerJson( dir, versions, async () => {
			ran = true;
			await expect( read() ).resolves.toBe( before );
		} );
		expect( ran ).toBe( true );
		await expect( read() ).resolves.toBe( before );
	} );

	test( 'restorePinnedComposerJsonSync recovers a file left pinned by an interrupted build', async () => {
		await write( monorepoJson );
		const before = await read();
		let pinnedDuring;
		// Simulate SIGINT: the callback never returns normally, so the finally never runs.
		await withPinnedComposerJson( dir, versions, async () => {
			pinnedDuring = await read();
			restorePinnedComposerJsonSync();
		} );
		expect( pinnedDuring ).not.toBe( before );
		await expect( read() ).resolves.toBe( before );
	} );
} );

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

	test( 'leaves the lock validating against the restored composer.json', async () => {
		await fs.writeFile( lockPath(), lockText( '0'.repeat( 32 ) ) );
		await withPinnedComposerJson( dir, versions, async () => {
			// Stand in for composer: rewrite the lock from the pinned manifest.
			await fs.writeFile( lockPath(), lockText( 'f'.repeat( 32 ) ) );
		} );
		const expected = await composerContentHash( npath.join( dir, 'composer.json' ) );
		expect( JSON.parse( await fs.readFile( lockPath(), 'utf8' ) )[ 'content-hash' ] ).toBe(
			expected
		);
	} );

	test( 'preserves the rest of the lock file byte-for-byte', async () => {
		await fs.writeFile( lockPath(), lockText( '0'.repeat( 32 ) ) );
		await withPinnedComposerJson( dir, versions, async () => {} );
		const after = await fs.readFile( lockPath(), 'utf8' );
		const hash = await composerContentHash( npath.join( dir, 'composer.json' ) );
		expect( after ).toBe( lockText( hash ) );
	} );

	test( 'does nothing when the project has no lock file', async () => {
		await withPinnedComposerJson( dir, versions, async () => {} );
		await expect( fs.access( lockPath() ) ).rejects.toThrow();
	} );
} );
