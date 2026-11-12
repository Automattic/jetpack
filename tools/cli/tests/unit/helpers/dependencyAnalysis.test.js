import { fileURLToPath } from 'url';
import { getDependencies, filterDeps, getBuildOrder } from '../../../helpers/dependencyAnalysis.js';

const dataDir = fileURLToPath( new URL( '../../data', import.meta.url ) );

expect.extend( {
	toMatchDeps( received, expected ) {
		const options = {
			isNot: this.isNot,
			promise: this.promise,
		};

		if ( ! ( received instanceof Map ) ) {
			return {
				message: () =>
					this.utils.matcherHint( 'toMatchDeps', undefined, undefined, options ) +
					`\n\nExpected: a Map` +
					`\nReceived: ${ this.utils.printReceived( received ) }`,
				pass: false,
			};
		}

		const map = {};
		for ( const [ k, v ] of received ) {
			if ( ! ( v instanceof Set ) ) {
				return {
					message: () =>
						this.utils.matcherHint( 'toMatchDeps', undefined, undefined, options ) +
						`\n\nExpected: a Set at index "${ k }"` +
						`\nReceived: ${ this.utils.printReceived( v ) }`,
					pass: false,
				};
			}
			map[ k ] = [ ...v ];
		}

		if ( ! this.equals( map, expected ) ) {
			return {
				message: () =>
					this.utils.matcherHint( 'toMatchDeps', undefined, undefined, options ) +
					'\n\n' +
					this.utils.printDiffOrStringify( expected, map, 'expected', 'received', this.expand ),
				pass: false,
			};
		}

		return {
			message: () =>
				this.utils.matcherHint( 'toMatchDeps', undefined, undefined, options ) +
				`\n\nExpected: not ${ this.utils.printReceived( expected ) }`,
			pass: true,
		};
	},
} );

describe( 'dependencyAnalysis', () => {
	describe( 'getDependencies', () => {
		test( 'monorepo', async () => {
			const ret = await getDependencies( dataDir + '/monorepo' );
			expect( ret ).toMatchDeps( {
				monorepo: [ 'packages/a' ],
				'packages/a': [],
				'packages/b': [ 'packages/a' ],
				'packages/c': [ 'js-packages/d', 'js-packages/e', 'packages/a', 'packages/b' ],
				'js-packages/d': [],
				'js-packages/e': [],
				'js-packages/f': [],
			} );
		} );

		test( 'monorepo, no dev deps', async () => {
			const ret = await getDependencies( dataDir + '/monorepo', null, true );
			expect( ret ).toMatchDeps( {
				monorepo: [ 'packages/a' ],
				'packages/a': [],
				'packages/b': [ 'packages/a' ],
				'packages/c': [ 'js-packages/d', 'packages/a' ],
				'js-packages/d': [],
				'js-packages/e': [],
				'js-packages/f': [],
			} );
		} );

		test( 'monorepo, build deps', async () => {
			const ret = await getDependencies( dataDir + '/monorepo', 'build' );
			expect( ret ).toMatchDeps( {
				monorepo: [ 'packages/a' ],
				'packages/a': [],
				'packages/b': [ 'packages/a' ],
				'packages/c': [ 'js-packages/d', 'js-packages/e', 'packages/a', 'packages/b' ],
				'js-packages/d': [],
				'js-packages/e': [],
				'js-packages/f': [ 'packages/b' ],
			} );
		} );

		test( 'monorepo, test deps', async () => {
			const ret = await getDependencies( dataDir + '/monorepo', 'test' );
			expect( ret ).toMatchDeps( {
				monorepo: [ 'packages/a' ],
				'packages/a': [],
				'packages/b': [ 'packages/a' ],
				'packages/c': [ 'js-packages/d', 'js-packages/e', 'packages/a', 'packages/b' ],
				'js-packages/d': [],
				'js-packages/e': [],
				'js-packages/f': [ 'js-packages/d', 'js-packages/e' ],
			} );
		} );

		test( 'monorepo-cycle', async () => {
			const ret = await getDependencies( dataDir + '/monorepo-cycle' );
			expect( ret ).toMatchDeps( {
				monorepo: [ 'packages/a' ],
				'packages/a': [],
				'packages/b': [ 'packages/a', 'packages/c' ],
				'packages/c': [ 'packages/a', 'packages/b' ],
			} );
		} );
	} );

	describe( 'filterDeps', () => {
		test( 'listed packages', async () => {
			const deps = await getDependencies( dataDir + '/monorepo', 'build' );
			deps.delete( 'monorepo' );
			const filteredDeps = filterDeps( deps, [ 'packages/a', 'packages/b', 'packages/c' ] );
			expect( filteredDeps ).toMatchDeps( {
				'packages/a': [],
				'packages/b': [ 'packages/a' ],
				'packages/c': [ 'packages/a', 'packages/b' ],
			} );
		} );

		test( 'dependencies', async () => {
			const deps = await getDependencies( dataDir + '/monorepo', 'build' );
			const filteredDeps = filterDeps( deps, [ 'js-packages/f' ], { dependencies: true } );
			expect( filteredDeps ).toMatchDeps( {
				'packages/a': [],
				'packages/b': [ 'packages/a' ],
				'js-packages/f': [ 'packages/b' ],
			} );
		} );

		test( 'dependents', async () => {
			const deps = await getDependencies( dataDir + '/monorepo', 'build' );
			const filteredDeps = filterDeps( deps, [ 'packages/b' ], { dependents: true } );
			expect( filteredDeps ).toMatchDeps( {
				'packages/b': [],
				'packages/c': [ 'packages/b' ],
				'js-packages/f': [ 'packages/b' ],
			} );
		} );

		test( 'dependencies and dependents', async () => {
			const deps = await getDependencies( dataDir + '/monorepo' );
			const filteredDeps = filterDeps( deps, [ 'packages/b' ], {
				dependencies: true,
				dependents: true,
			} );
			expect( filteredDeps ).toMatchDeps( {
				monorepo: [ 'packages/a' ],
				'packages/a': [],
				'packages/b': [ 'packages/a' ],
				'packages/c': [ 'js-packages/d', 'js-packages/e', 'packages/a', 'packages/b' ],
				'js-packages/d': [],
				'js-packages/e': [],
			} );
		} );

		describe( 'dependents with a Map', () => {
			// A require-devs X, B requires A, C require-devs B and requires E, D requires C.
			const toMap = obj =>
				new Map( Object.entries( obj ).map( ( [ k, v ] ) => [ k, new Set( v ) ] ) );
			const prodDeps = toMap( { X: [], A: [], B: [ 'A' ], C: [ 'E' ], D: [ 'C' ], E: [] } );
			const deps = toMap( {
				X: [],
				A: [ 'X' ],
				B: [ 'A' ],
				C: [ 'B', 'E' ],
				D: [ 'C' ],
				E: [],
			} );

			test.each( [
				[ 'X', false, { X: [], A: [ 'X' ] } ],
				[ 'A', false, { A: [], B: [ 'A' ], C: [ 'B' ] } ],
				[ 'A', true, { X: [], A: [ 'X' ], B: [ 'A' ], C: [ 'B', 'E' ], E: [] } ],
			] )( 'changing %s, dependencies %s', ( changed, dependencies, expected ) => {
				expect(
					filterDeps( deps, [ changed ], { dependencies, dependents: prodDeps } )
				).toMatchDeps( expected );
			} );
		} );
	} );

	describe( 'getBuildOrder', () => {
		test( 'monorepo', async () => {
			const deps = await getDependencies( dataDir + '/monorepo', 'build' );
			deps.delete( 'monorepo' );
			expect( getBuildOrder( deps ) ).toEqual( [
				[ 'js-packages/d', 'js-packages/e', 'packages/a' ],
				[ 'packages/b' ],
				[ 'js-packages/f', 'packages/c' ],
			] );
		} );

		test( 'monorepo-cycle', async () => {
			const deps = await getDependencies( dataDir + '/monorepo-cycle', 'build' );
			deps.delete( 'monorepo' );

			let err;
			expect( () => {
				try {
					getBuildOrder( deps );
				} catch ( e ) {
					err = e;
					throw e;
				}
			} ).toThrow( 'The dependency graph contains a cycle!' );
			expect( err.deps ).toMatchDeps( {
				'packages/b': [ 'packages/c' ],
				'packages/c': [ 'packages/b' ],
			} );
		} );
	} );
} );
