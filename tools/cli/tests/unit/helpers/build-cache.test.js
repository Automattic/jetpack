import fs from 'fs/promises';
import os from 'os';
import npath from 'path';
import { execa } from 'execa';
import {
	computeFingerprints,
	fingerprintProjects,
	canSkip,
	invalidateManifest,
	writeManifest,
} from '../../../helpers/build-cache.js';

// A tiny graph: B depends on A; C is independent.
const baseInputs = () => ( {
	buildOrder: [ 'packages/a', 'packages/b', 'packages/c' ],
	dependencies: new Map( [
		[ 'packages/a', new Set() ],
		[ 'packages/b', new Set( [ 'packages/a' ] ) ],
		[ 'packages/c', new Set() ],
	] ),
	mode: 'development',
	flags: 'pin:false lock:true',
	toolVersion: 'tool-v1',
	committed: new Map( [
		[ 'packages/a', [ 'sha-a1\tprojects/packages/a/src/x.php' ] ],
		[ 'packages/b', [ 'sha-b1\tprojects/packages/b/src/y.php' ] ],
		[ 'packages/c', [ 'sha-c1\tprojects/packages/c/src/z.php' ] ],
	] ),
	dirty: new Map(),
} );

/**
 * Create a throwaway git repo, chdir into it, and return its path.
 *
 * `projectDir` and the git calls resolve against process.cwd(), so tests run from inside it.
 *
 * @return {Promise<string>} Repo path.
 */
async function enterTempRepo() {
	const dir = await fs.realpath( await fs.mkdtemp( npath.join( os.tmpdir(), 'jp-cache-' ) ) );
	await execa( 'git', [ 'init', '-q' ], { cwd: dir } );
	process.chdir( dir );
	return dir;
}

const writeFile = async ( path, content = 'x' ) => {
	await fs.mkdir( npath.dirname( path ), { recursive: true } );
	await fs.writeFile( path, content );
};

describe( 'build-cache fingerprintProjects', () => {
	test( 'is deterministic for identical inputs', () => {
		const a = fingerprintProjects( baseInputs() );
		const b = fingerprintProjects( baseInputs() );
		expect( [ ...a ] ).toEqual( [ ...b ] );
	} );

	test( 'changing a source file invalidates that project but not unrelated siblings', () => {
		const before = fingerprintProjects( baseInputs() );
		const changed = baseInputs();
		changed.committed.set( 'packages/a', [ 'sha-a2\tprojects/packages/a/src/x.php' ] );
		const after = fingerprintProjects( changed );

		expect( after.get( 'packages/a' ) ).not.toBe( before.get( 'packages/a' ) );
		expect( after.get( 'packages/c' ) ).toBe( before.get( 'packages/c' ) );
	} );

	test( 'a dependency change cascades to its dependents', () => {
		const before = fingerprintProjects( baseInputs() );
		const changed = baseInputs();
		changed.committed.set( 'packages/a', [ 'sha-a2\tprojects/packages/a/src/x.php' ] );
		const after = fingerprintProjects( changed );

		expect( after.get( 'packages/b' ) ).not.toBe( before.get( 'packages/b' ) );
	} );

	test( 'an uncommitted (dirty) change invalidates the project', () => {
		const before = fingerprintProjects( baseInputs() );
		const changed = baseInputs();
		changed.dirty.set( 'packages/c', [ 'wt-hash projects/packages/c/src/z.php' ] );
		const after = fingerprintProjects( changed );

		expect( after.get( 'packages/c' ) ).not.toBe( before.get( 'packages/c' ) );
	} );

	test.each( [
		[ 'mode', 'production' ],
		[ 'flags', 'pin:true lock:true' ],
		[ 'toolVersion', 'tool-v2' ],
	] )( 'changing %s invalidates every project', ( key, value ) => {
		const before = fingerprintProjects( baseInputs() );
		const changed = baseInputs();
		changed[ key ] = value;
		const after = fingerprintProjects( changed );

		for ( const slug of before.keys() ) {
			expect( after.get( slug ) ).not.toBe( before.get( slug ) );
		}
	} );

	test( 'omitting a dependency from the order changes the dependent fingerprint', () => {
		const withDep = fingerprintProjects( baseInputs() );
		const inputsNoDep = baseInputs();
		inputsNoDep.buildOrder = [ 'packages/b', 'packages/c' ];
		const withoutDep = fingerprintProjects( inputsNoDep );
		expect( withoutDep.get( 'packages/b' ) ).not.toBe( withDep.get( 'packages/b' ) );
	} );

	test( 'file ordering within a project does not affect the fingerprint', () => {
		const ordered = baseInputs();
		ordered.committed.set( 'packages/a', [
			'sha-1\tprojects/packages/a/a.php',
			'sha-2\tprojects/packages/a/b.php',
		] );
		const reversed = baseInputs();
		reversed.committed.set( 'packages/a', [
			'sha-2\tprojects/packages/a/b.php',
			'sha-1\tprojects/packages/a/a.php',
		] );

		expect( fingerprintProjects( ordered ).get( 'packages/a' ) ).toBe(
			fingerprintProjects( reversed ).get( 'packages/a' )
		);
	} );
} );

describe( 'computeFingerprints against a real repo', () => {
	const deps = new Map( [
		[ 'packages/a', new Set() ],
		[ 'packages/b', new Set() ],
	] );
	let dir, cwd;
	const fingerprint = () => computeFingerprints( deps, {} );

	beforeEach( async () => {
		cwd = process.cwd();
		dir = await enterTempRepo();
		await writeFile( npath.join( dir, 'projects/packages/a/src/x.php' ) );
		await writeFile( npath.join( dir, 'projects/packages/a/src/with space.php' ) );
		await writeFile( npath.join( dir, 'projects/packages/b/src/y.php' ) );
		await execa( 'git', [ 'add', '-A' ], { cwd: dir } );
		await execa( 'git', [ '-c', 'user.name=t', '-c', 'user.email=t@t', 'commit', '-qm', 'init' ], {
			cwd: dir,
		} );
	} );
	afterEach( async () => {
		process.chdir( cwd );
		await fs.rm( dir, { recursive: true, force: true } );
	} );

	test.each( [
		[
			'an edited tracked file',
			true,
			d => writeFile( `${ d }/projects/packages/a/src/x.php`, 'y' ),
		],
		[ 'a new untracked directory', true, d => writeFile( `${ d }/projects/packages/a/new/z.php` ) ],
		[ 'a deleted tracked file', true, d => fs.rm( `${ d }/projects/packages/a/src/x.php` ) ],
		[
			'an edited file whose name has a space',
			true,
			d => writeFile( `${ d }/projects/packages/a/src/with space.php`, 'y' ),
		],
		[
			'a changelog entry',
			false,
			d => writeFile( `${ d }/projects/packages/a/changelog/add-thing`, 'Significance: patch' ),
		],
		[ 'a root file outside the tool files', false, d => writeFile( `${ d }/notes.js` ) ],
	] )( '%s changes the fingerprint: %s', async ( _, expectChange, mutate ) => {
		const before = await fingerprint();
		await mutate( dir );
		const after = await fingerprint();

		expect( after.get( 'packages/a' ) !== before.get( 'packages/a' ) ).toBe( expectChange );
		expect( after.get( 'packages/b' ) ).toBe( before.get( 'packages/b' ) );
	} );
} );

describe( 'canSkip / writeManifest', () => {
	const SLUG = 'packages/thing';
	let dir, cwd;

	const projectPath = ( ...p ) => npath.join( dir, 'projects', SLUG, ...p );
	const addOutput = file => writeFile( projectPath( file ) );

	beforeEach( async () => {
		cwd = process.cwd();
		dir = await enterTempRepo();
		// A pattern with a slash anchors to its .gitignore's directory, so this must be in the project.
		await writeFile(
			projectPath( '.gitignore' ),
			'/build/\n/app/assets/dist/\nnode_modules/\n.DS_Store\n'
		);
	} );
	afterEach( async () => {
		process.chdir( cwd );
		await fs.rm( dir, { recursive: true, force: true } );
	} );

	test( 'does not skip a project that has never been built', async () => {
		await addOutput( 'build/out.js' );
		await expect( canSkip( SLUG, 'fp1' ) ).resolves.toBe( false );
	} );

	test( 'skips a project rebuilt with the same fingerprint', async () => {
		await addOutput( 'build/out.js' );
		await writeManifest( SLUG, 'fp1' );
		await expect( canSkip( SLUG, 'fp1' ) ).resolves.toBe( true );
	} );

	test( 'does not skip when the fingerprint changed', async () => {
		await addOutput( 'build/out.js' );
		await writeManifest( SLUG, 'fp1' );
		await expect( canSkip( SLUG, 'fp2' ) ).resolves.toBe( false );
	} );

	test( 'does not skip a project that produced no output at all', async () => {
		await writeManifest( SLUG, 'fp1' );
		await expect( canSkip( SLUG, 'fp1' ) ).resolves.toBe( false );
	} );

	test( 'does not skip after the manifest is invalidated', async () => {
		await addOutput( 'build/out.js' );
		await writeManifest( SLUG, 'fp1' );
		await invalidateManifest( SLUG );
		await expect( canSkip( SLUG, 'fp1' ) ).resolves.toBe( false );
	} );

	test.each( [
		[
			'the whole output directory is deleted',
			() => fs.rm( projectPath( 'build' ), { recursive: true } ),
		],
		[
			'a single file inside an output directory is deleted',
			() => fs.rm( projectPath( 'build/two.js' ) ),
		],
		[
			'an output file is renamed',
			() => fs.rename( projectPath( 'build/one.js' ), projectPath( 'build/renamed.js' ) ),
		],
		[
			'an output file is rewritten in place',
			async () => {
				await fs.writeFile( projectPath( 'build/one.js' ), 'y' );
				const later = new Date( Date.now() + 5000 );
				await fs.utimes( projectPath( 'build/one.js' ), later, later );
			},
		],
		[
			'a nested output directory is deleted',
			() => fs.rm( projectPath( 'app/assets/dist' ), { recursive: true } ),
		],
	] )( 'does not skip when %s', async ( _, mutate ) => {
		await addOutput( 'build/one.js' );
		await addOutput( 'build/two.js' );
		await addOutput( 'app/assets/dist/bundle.js' );
		await writeManifest( SLUG, 'fp1' );
		await expect( canSkip( SLUG, 'fp1' ) ).resolves.toBe( true );
		await mutate();
		await expect( canSkip( SLUG, 'fp1' ) ).resolves.toBe( false );
	} );

	test.each( [ 'node_modules/dep/index.js', 'tests/e2e/node_modules/dep/index.js', '.DS_Store' ] )(
		'still skips when non-output %s appears',
		async file => {
			await addOutput( 'build/out.js' );
			await writeManifest( SLUG, 'fp1' );
			await addOutput( file );
			await expect( canSkip( SLUG, 'fp1' ) ).resolves.toBe( true );
		}
	);
} );
