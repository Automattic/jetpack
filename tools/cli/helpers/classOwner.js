import fs from 'fs/promises';
import path from 'path';
import { execa } from 'execa';
import { glob } from 'glob';

let psr4CachePromise = null;

/**
 * Build (and cache) the map of PSR-4 namespace prefix → owning project slug.
 *
 * Sourced from every `projects/{plugins,packages}/* /composer.json`'s
 * `autoload.psr-4` and `autoload-dev.psr-4` sections.
 *
 * @param {string} [cwd] - Monorepo root.
 * @return {Promise<Array<{ prefix: string, slug: string }>>} Entries sorted by prefix length (longest first).
 */
async function loadPsr4Map( cwd = process.cwd() ) {
	if ( ! psr4CachePromise ) {
		psr4CachePromise = ( async () => {
			const entries = [];
			const files = await glob( 'projects/*/*/composer.json', { cwd } );
			for ( const file of files ) {
				const slug = file.substring( 9, file.length - '/composer.json'.length );
				let json;
				try {
					json = JSON.parse( await fs.readFile( path.join( cwd, file ), { encoding: 'utf8' } ) );
				} catch {
					continue;
				}
				const sections = [ json.autoload?.[ 'psr-4' ], json[ 'autoload-dev' ]?.[ 'psr-4' ] ];
				for ( const section of sections ) {
					if ( ! section ) {
						continue;
					}
					for ( const prefix of Object.keys( section ) ) {
						if ( prefix ) {
							entries.push( { prefix: prefix.replace( /^\\+/, '' ), slug } );
						}
					}
				}
			}
			entries.sort( ( a, b ) => b.prefix.length - a.prefix.length );
			return entries;
		} )();
	}
	return psr4CachePromise;
}

/**
 * Reset the cached PSR-4 map. Test-only.
 */
export function _resetCache() {
	psr4CachePromise = null;
}

/**
 * Resolve a class/interface/trait FQN to its owning project slug.
 *
 * Tries PSR-4 prefix matching first (longest prefix wins), then falls back to a
 * `git grep` for the short name across `projects/`.
 *
 * @param {string} fqn   - Fully-qualified name, e.g. "Automattic\\Jetpack\\Foo\\Bar".
 * @param {string} [cwd] - Monorepo root.
 * @return {Promise<string|null>} Project slug (e.g. "packages/foo"), or null if not resolved.
 */
export async function findOwnerProject( fqn, cwd = process.cwd() ) {
	const normalized = fqn.replace( /^\\+/, '' );
	const map = await loadPsr4Map( cwd );
	for ( const { prefix, slug } of map ) {
		if ( normalized === prefix.replace( /\\$/, '' ) || normalized.startsWith( prefix ) ) {
			return slug;
		}
	}

	// Fallback: grep the source tree. Most Jetpack packages use classmap autoload
	// rather than PSR-4, so this is the main code path in practice.
	const shortName = normalized.split( '\\' ).pop();
	if ( ! shortName || ! /^[A-Za-z_][A-Za-z0-9_]*$/.test( shortName ) ) {
		return null;
	}
	// `--untracked` so we find class files that exist on disk but haven't been added yet,
	// which is the exact branch-switch / new-file scenario the user hits in practice.
	let grepStdout;
	try {
		grepStdout = (
			await execa(
				'git',
				[
					'grep',
					'--untracked',
					'-l',
					'--',
					`\\(class\\|interface\\|trait\\)\\s\\+${ shortName }\\b`,
					'projects/',
				],
				{ cwd, reject: false }
			)
		).stdout;
	} catch {
		return null;
	}
	const namespace = normalized.split( '\\' ).slice( 0, -1 ).join( '\\' );
	const candidates = grepStdout.split( '\n' ).filter( Boolean );

	// If we have a namespace, verify each candidate declares the same namespace
	// before accepting it — multiple packages can declare classes with the same short name.
	for ( const candidate of candidates ) {
		const slug = candidate.match( /^projects\/([^/]+\/[^/]+)\// )?.[ 1 ];
		if ( ! slug ) {
			continue;
		}
		if ( ! namespace ) {
			return slug;
		}
		const fileNs = await readNamespace( path.join( cwd, candidate ) );
		if ( fileNs === namespace ) {
			return slug;
		}
	}
	// Namespace-verified match wasn't found; if there's only one candidate, fall back to it.
	if ( candidates.length === 1 ) {
		return candidates[ 0 ].match( /^projects\/([^/]+\/[^/]+)\// )?.[ 1 ] || null;
	}
	return null;
}

/**
 * Read the `namespace X\Y\Z` declaration from a PHP file, if any.
 *
 * @param {string} file - Absolute path to the PHP file.
 * @return {Promise<string|null>} The namespace string, or null when none is declared.
 */
async function readNamespace( file ) {
	try {
		const data = await fs.readFile( file, { encoding: 'utf8' } );
		const m = data.match( /^\s*namespace\s+([^\s;{]+)\s*[;{]/m );
		return m ? m[ 1 ].replace( /^\\+/, '' ) : null;
	} catch {
		return null;
	}
}
