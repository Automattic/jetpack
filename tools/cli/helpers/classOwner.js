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

	// Phase 1: namespace-verified match. Multiple packages can declare classes
	// with the same short name (e.g. "Manager"), so when we have a namespace,
	// only accept candidates whose `namespace X\Y;` declaration matches.
	for ( const candidate of candidates ) {
		const slug = candidate.match( /^projects\/([^/]+\/[^/]+)\// )?.[ 1 ];
		if ( ! slug ) {
			continue;
		}
		if ( ! namespace ) {
			// No namespace to verify — bail out of phase 1, let phase 2 handle it.
			break;
		}
		const fileNs = await readNamespace( path.join( cwd, candidate ) );
		if ( fileNs === namespace ) {
			return slug;
		}
	}

	// Phase 2: no namespace-verified match. Restrict candidates to files that
	// look like real class definitions (Jetpack's class-<short>.php convention,
	// or files under a src/, classes/, lib/, or legacy/ directory). This filters
	// out test fixtures, README excerpts, and incidental "class Foo" mentions.
	const plausible = candidates.filter( looksLikeClassFile );
	if ( plausible.length === 1 ) {
		return plausible[ 0 ].match( /^projects\/([^/]+\/[^/]+)\// )?.[ 1 ] || null;
	}
	if ( ! namespace && candidates.length === 1 ) {
		// FQN had no namespace and exactly one candidate exists — accept it.
		return candidates[ 0 ].match( /^projects\/([^/]+\/[^/]+)\// )?.[ 1 ] || null;
	}
	return null;
}

/**
 * Heuristic: does this file path look like a class definition (vs. a test
 * fixture, README, or arbitrary mention of "class X" in a comment or string)?
 *
 * @param {string} file - Repo-relative path returned by `git grep`.
 * @return {boolean} True when the path matches a Jetpack class-file convention.
 */
function looksLikeClassFile( file ) {
	if ( /\/(tests|test|__tests__|fixtures|stubs)\//i.test( file ) ) {
		return false;
	}
	if ( /\/class-[a-z0-9-]+\.php$/i.test( file ) ) {
		return true;
	}
	// PSR-4-style same-name file (Manager.php for class Manager). Looser than
	// strict PSR-4 but catches the convention.
	if ( /\/[A-Z][A-Za-z0-9_]*\.php$/.test( file ) ) {
		return true;
	}
	// Inside a conventional source directory.
	if ( /\/(src|classes|lib|legacy)\//i.test( file ) ) {
		return true;
	}
	return false;
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
