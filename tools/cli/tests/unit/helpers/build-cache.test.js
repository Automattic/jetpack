import { fingerprintProjects } from '../../../helpers/build-cache.js';

// A tiny graph: B depends on A; C is independent.
const baseInputs = () => ( {
	buildOrder: [ 'packages/a', 'packages/b', 'packages/c' ],
	dependencies: new Map( [
		[ 'packages/a', new Set() ],
		[ 'packages/b', new Set( [ 'packages/a' ] ) ],
		[ 'packages/c', new Set() ],
	] ),
	mode: 'development',
	toolVersion: 'tool-v1',
	committed: new Map( [
		[ 'packages/a', [ 'sha-a1\tprojects/packages/a/src/x.php' ] ],
		[ 'packages/b', [ 'sha-b1\tprojects/packages/b/src/y.php' ] ],
		[ 'packages/c', [ 'sha-c1\tprojects/packages/c/src/z.php' ] ],
	] ),
	dirty: new Map(),
} );

describe( 'build-cache fingerprintProjects', () => {
	test( 'is deterministic for identical inputs', () => {
		const a = fingerprintProjects( baseInputs() );
		const b = fingerprintProjects( baseInputs() );
		expect( [ ...a ] ).toEqual( [ ...b ] );
	} );

	test( 'produces a distinct fingerprint per project', () => {
		const fps = fingerprintProjects( baseInputs() );
		const values = [ ...fps.values() ];
		expect( new Set( values ).size ).toBe( 3 );
	} );

	test( 'changing a source file invalidates that project but not unrelated siblings', () => {
		const before = fingerprintProjects( baseInputs() );
		const changed = baseInputs();
		changed.committed.set( 'packages/a', [ 'sha-a2\tprojects/packages/a/src/x.php' ] );
		const after = fingerprintProjects( changed );

		expect( after.get( 'packages/a' ) ).not.toBe( before.get( 'packages/a' ) );
		// C is independent of A — unchanged.
		expect( after.get( 'packages/c' ) ).toBe( before.get( 'packages/c' ) );
	} );

	test( 'a dependency change cascades to its dependents', () => {
		const before = fingerprintProjects( baseInputs() );
		const changed = baseInputs();
		changed.committed.set( 'packages/a', [ 'sha-a2\tprojects/packages/a/src/x.php' ] );
		const after = fingerprintProjects( changed );

		// B depends on A, so B's fingerprint must change even though B's own files did not.
		expect( after.get( 'packages/b' ) ).not.toBe( before.get( 'packages/b' ) );
	} );

	test( 'an uncommitted (dirty) change invalidates the project', () => {
		const before = fingerprintProjects( baseInputs() );
		const changed = baseInputs();
		changed.dirty.set( 'packages/c', [ 'wt-hash projects/packages/c/src/z.php' ] );
		const after = fingerprintProjects( changed );

		expect( after.get( 'packages/c' ) ).not.toBe( before.get( 'packages/c' ) );
	} );

	test( 'production and development modes yield different fingerprints', () => {
		const dev = fingerprintProjects( baseInputs() );
		const prodInputs = baseInputs();
		prodInputs.mode = 'production';
		const prod = fingerprintProjects( prodInputs );

		for ( const slug of dev.keys() ) {
			expect( prod.get( slug ) ).not.toBe( dev.get( slug ) );
		}
	} );

	test( 'a tool-version change invalidates every project', () => {
		const before = fingerprintProjects( baseInputs() );
		const changed = baseInputs();
		changed.toolVersion = 'tool-v2';
		const after = fingerprintProjects( changed );

		for ( const slug of before.keys() ) {
			expect( after.get( slug ) ).not.toBe( before.get( slug ) );
		}
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
