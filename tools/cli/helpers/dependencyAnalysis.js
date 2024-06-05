import fs from 'fs/promises';
import { glob } from 'glob';

/**
 * Collect project dependencies.
 *
 * @param {string} root - Monorepo root directory.
 * @param {string|null} extra - Extra deps to include, "build" or "test".
 * @param {boolean} noDev - Exclude dev dependencies.
 * @returns {Map} Key is the project slug, value is a Set of slugs depended on.
 */
export async function getDependencies( root, extra = null, noDev = false ) {
	const ret = new Map();

	// Collect all project slugs.
	ret.set( 'monorepo', new Set() );
	for ( const file of await glob( 'projects/*/*/composer.json', { cwd: root } ) ) {
		ret.set( file.substring( 9, file.length - 14 ), new Set() );
	}

	// Collect package name→slug mappings.
	const packageMap = new Map();
	for ( const file of await glob( 'projects/packages/*/composer.json', {
		cwd: root,
	} ) ) {
		const slug = file.substring( 9, file.length - 14 );
		if ( ! ret.has( slug ) ) {
			// Not an actual project (should never happen here, but...).
			continue;
		}

		const json = JSON.parse( await fs.readFile( `${ root }/${ file }`, { encoding: 'utf8' } ) );
		if ( json.name ) {
			packageMap.set( json.name, slug );
		}
	}

	// Collect js-package name→slug mappings.
	const jsPackageMap = new Map();
	for ( const file of await glob( 'projects/js-packages/*/package.json', {
		cwd: root,
	} ) ) {
		const slug = file.substring( 9, file.length - 13 );
		if ( ! ret.has( slug ) ) {
			// Not an actual project.
			continue;
		}

		const json = JSON.parse( await fs.readFile( `${ root }/${ file }`, { encoding: 'utf8' } ) );
		if ( json.name ) {
			jsPackageMap.set( json.name, slug );
		}
	}

	// Collect dependencies.
	for ( const [ slug, depset ] of ret.entries() ) {
		const path = slug === 'monorepo' ? root : `${ root }/projects/${ slug }`;
		let deps = [];

		// Collect composer require, require-dev, and .extra.dependencies.
		const composerJson = JSON.parse(
			await fs.readFile( path + '/composer.json', { encoding: 'utf8' } )
		);
		for ( const [ pkg, pkgslug ] of packageMap.entries() ) {
			if (
				composerJson.require?.[ pkg ] ||
				( composerJson[ 'require-dev' ]?.[ pkg ] && ! noDev )
			) {
				deps.push( pkgslug );
			}
		}
		if ( extra && composerJson.extra?.dependencies?.[ extra ] ) {
			deps.push( ...composerJson.extra.dependencies[ extra ] );
		}

		// Collect JS dependencies and devDependencies.
		if ( ( await fs.access( path + '/package.json' ).catch( () => false ) ) !== false ) {
			const packageJson = JSON.parse(
				await fs.readFile( path + '/package.json', { encoding: 'utf8' } )
			);
			for ( const [ pkg, pkgslug ] of jsPackageMap.entries() ) {
				if (
					packageJson.dependencies?.[ pkg ] ||
					( packageJson.devDependencies?.[ pkg ] && ! noDev )
				) {
					deps.push( pkgslug );
				}
			}
		}

		// Remove any test-only dependencies, unless test dependencies were requested.
		if ( extra !== 'test' && composerJson.extra?.dependencies?.[ 'test-only' ] ) {
			const undeps = new Set( composerJson.extra?.dependencies?.[ 'test-only' ] );
			deps = deps.filter( v => ! undeps.has( v ) );
		}

		// Sort the dependencies and put them in the set.
		deps.sort().forEach( d => depset.add( d ) );
	}

	return ret;
}

/**
 * Filter dependencies to a set of projects.
 *
 * @param {Map} deps - Dependencies.
 * @param {string[]} projects - Projects to include.
 * @param {object} options - Options.
 * @param {boolean} options.dependencies - Keep the dependencies of the specified projects too.
 * @param {boolean} options.dependents - Keep the dependents of the specified projects too.
 * @returns {Map} Filtered dependencies.
 */
export function filterDeps( deps, projects, options = {} ) {
	const keep = new Set( projects );

	// Apply options.dependencies and options.dependents until there is no further change.
	let l = 0;
	while ( l !== keep.size ) {
		l = keep.size;

		if ( options.dependencies ) {
			// Keep dependencies: For everything in keep, add its dependencies.
			for ( const p of keep.values() ) {
				for ( const d of deps.get( p ).values() ) {
					keep.add( d );
				}
			}
		}

		if ( options.dependents ) {
			// Keep dependents: For everything in deps (and not already kept), add it if any of its dependencies are in keep.
			for ( const [ p, pd ] of deps.entries() ) {
				if ( ! keep.has( p ) ) {
					for ( const d of pd ) {
						if ( keep.has( d ) ) {
							keep.add( p );
							break;
						}
					}
				}
			}
		}
	}

	const ret = new Map();
	for ( const [ p, pd ] of deps.entries() ) {
		if ( keep.has( p ) ) {
			ret.set( p, new Set( [ ...pd ].filter( d => keep.has( d ) ) ) );
		}
	}

	return ret;
}

/**
 * List projects in build order.
 *
 * @param {Map} deps - Dependencies.
 * @returns {string[][]} Groups of project slugs. Projects in each group only depend on earlier groups.
 * @throws {Error} If the dependencies contain a cycle. The error object has a `deps` property with the residual dependencies.
 */
export function getBuildOrder( deps ) {
	// We look for packages that have no outgoing dependencies, collect then and remove them from the dependency graph, then repeat.
	// This is basically Kahn's algorithm with some steps interleaved.

	const ret = [];
	while ( deps.size > 0 ) {
		const ok = Array.from( deps.keys() )
			.filter( d => deps.get( d ).size === 0 )
			.sort();
		if ( ok.length === 0 ) {
			const e = new Error( 'The dependency graph contains a cycle!' );
			e.deps = deps;
			throw e;
		}
		ret.push( ok );

		for ( const slug of ok ) {
			deps.delete( slug );
		}
		for ( const v of deps.values() ) {
			ok.forEach( d => v.delete( d ) );
		}
	}

	return ret;
}
