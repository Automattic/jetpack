import { fileURLToPath } from 'url';
import chai from 'chai';
import { getDependencies, filterDeps, getBuildOrder } from '../../../helpers/dependencyAnalysis.js';

const dataDir = fileURLToPath( new URL( '../../data', import.meta.url ) );

const compareDeps = ( actual, expect ) => {
	chai.expect( actual ).to.be.a( 'Map' );
	const map = {};
	for ( const [ k, v ] of actual ) {
		chai.expect( v ).to.be.a( 'Set', k );
		map[ k ] = [ ...v ];
	}
	chai.expect( map ).to.deep.equal( expect );
};

describe( 'dependencyAnalysis', () => {
	describe( 'getDependencies', () => {
		it( 'monorepo', async () => {
			const ret = await getDependencies( dataDir + '/monorepo' );
			compareDeps( ret, {
				monorepo: [ 'packages/a' ],
				'packages/a': [],
				'packages/b': [ 'packages/a' ],
				'packages/c': [ 'js-packages/d', 'js-packages/e', 'packages/a', 'packages/b' ],
				'js-packages/d': [],
				'js-packages/e': [],
				'js-packages/f': [],
			} );
		} );

		it( 'monorepo, build deps', async () => {
			const ret = await getDependencies( dataDir + '/monorepo', 'build' );
			compareDeps( ret, {
				monorepo: [ 'packages/a' ],
				'packages/a': [],
				'packages/b': [ 'packages/a' ],
				'packages/c': [ 'js-packages/d', 'js-packages/e', 'packages/a', 'packages/b' ],
				'js-packages/d': [],
				'js-packages/e': [],
				'js-packages/f': [ 'packages/b' ],
			} );
		} );

		it( 'monorepo, test deps', async () => {
			const ret = await getDependencies( dataDir + '/monorepo', 'test' );
			compareDeps( ret, {
				monorepo: [ 'packages/a' ],
				'packages/a': [],
				'packages/b': [ 'packages/a' ],
				'packages/c': [ 'js-packages/d', 'js-packages/e', 'packages/a', 'packages/b' ],
				'js-packages/d': [],
				'js-packages/e': [],
				'js-packages/f': [ 'js-packages/d', 'js-packages/e' ],
			} );
		} );

		it( 'monorepo-cycle', async () => {
			const ret = await getDependencies( dataDir + '/monorepo-cycle' );
			compareDeps( ret, {
				monorepo: [ 'packages/a' ],
				'packages/a': [],
				'packages/b': [ 'packages/a', 'packages/c' ],
				'packages/c': [ 'packages/a', 'packages/b' ],
			} );
		} );
	} );

	describe( 'filterDeps', () => {
		it( 'listed packages', async () => {
			const deps = await getDependencies( dataDir + '/monorepo', 'build' );
			deps.delete( 'monorepo' );
			const filteredDeps = filterDeps( deps, [ 'packages/a', 'packages/b', 'packages/c' ] );
			compareDeps( filteredDeps, {
				'packages/a': [],
				'packages/b': [ 'packages/a' ],
				'packages/c': [ 'packages/a', 'packages/b' ],
			} );
		} );

		it( 'dependencies', async () => {
			const deps = await getDependencies( dataDir + '/monorepo', 'build' );
			const filteredDeps = filterDeps( deps, [ 'js-packages/f' ], { dependencies: true } );
			compareDeps( filteredDeps, {
				'packages/a': [],
				'packages/b': [ 'packages/a' ],
				'js-packages/f': [ 'packages/b' ],
			} );
		} );

		it( 'dependents', async () => {
			const deps = await getDependencies( dataDir + '/monorepo', 'build' );
			const filteredDeps = filterDeps( deps, [ 'packages/b' ], { dependents: true } );
			compareDeps( filteredDeps, {
				'packages/b': [],
				'packages/c': [ 'packages/b' ],
				'js-packages/f': [ 'packages/b' ],
			} );
		} );

		it( 'dependencies and dependents', async () => {
			const deps = await getDependencies( dataDir + '/monorepo' );
			const filteredDeps = filterDeps( deps, [ 'packages/b' ], {
				dependencies: true,
				dependents: true,
			} );
			compareDeps( filteredDeps, {
				monorepo: [ 'packages/a' ],
				'packages/a': [],
				'packages/b': [ 'packages/a' ],
				'packages/c': [ 'js-packages/d', 'js-packages/e', 'packages/a', 'packages/b' ],
				'js-packages/d': [],
				'js-packages/e': [],
			} );
		} );
	} );

	describe( 'getBuildOrder', () => {
		it( 'monorepo', async () => {
			const deps = await getDependencies( dataDir + '/monorepo', 'build' );
			deps.delete( 'monorepo' );
			chai
				.expect( getBuildOrder( deps ) )
				.to.deep.equal( [
					[ 'js-packages/d', 'js-packages/e', 'packages/a' ],
					[ 'packages/b' ],
					[ 'js-packages/f', 'packages/c' ],
				] );
		} );

		it( 'monorepo-cycle', async () => {
			const deps = await getDependencies( dataDir + '/monorepo-cycle', 'build' );
			deps.delete( 'monorepo' );
			try {
				getBuildOrder( deps );
				chai.assert.fail( 'Call was supposed to fail' );
			} catch ( e ) {
				chai.expect( e ).to.be.an( 'Error' );
				chai.expect( e.message ).to.equal( 'The dependency graph contains a cycle!' );
				compareDeps( e.deps, {
					'packages/b': [ 'packages/c' ],
					'packages/c': [ 'packages/b' ],
				} );
			}
		} );
	} );
} );
