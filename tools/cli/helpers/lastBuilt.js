import fs from 'fs/promises';
import path from 'path';
import { execa } from 'execa';

const STAMP_DIR = '.jetpack-cli/last-built';

/**
 * Resolve the absolute directory where per-project last-built SHAs are stored.
 *
 * @param {string} [cwd] - Monorepo root.
 * @return {string} Absolute path to the stamp directory.
 */
export function stampDir( cwd = process.cwd() ) {
	return path.resolve( cwd, STAMP_DIR );
}

/**
 * Path to a project's last-built stamp file.
 *
 * @param {string} slug  - Project slug (e.g. "plugins/jetpack").
 * @param {string} [cwd] - Monorepo root.
 * @return {string} Absolute path.
 */
function stampPath( slug, cwd = process.cwd() ) {
	const safe = slug.replace( /\//g, '__' );
	return path.join( stampDir( cwd ), `${ safe }.sha` );
}

/**
 * Read the last-built SHA for a project, if any.
 *
 * @param {string} slug  - Project slug.
 * @param {string} [cwd] - Monorepo root.
 * @return {Promise<string|null>} The SHA, or null if no stamp exists.
 */
export async function readStamp( slug, cwd = process.cwd() ) {
	try {
		const data = await fs.readFile( stampPath( slug, cwd ), { encoding: 'utf8' } );
		const sha = data.trim();
		return sha || null;
	} catch ( e ) {
		if ( e.code === 'ENOENT' ) {
			return null;
		}
		throw e;
	}
}

/**
 * Write the last-built SHA for a project.
 *
 * @param {string} slug  - Project slug.
 * @param {string} sha   - Git SHA to record.
 * @param {string} [cwd] - Monorepo root.
 */
export async function writeStamp( slug, sha, cwd = process.cwd() ) {
	const file = stampPath( slug, cwd );
	await fs.mkdir( path.dirname( file ), { recursive: true } );
	await fs.writeFile( file, sha + '\n', { encoding: 'utf8' } );
}

/**
 * Resolve the current HEAD SHA of the monorepo.
 *
 * @param {string} [cwd] - Monorepo root.
 * @return {Promise<string>} The SHA.
 */
export async function currentHead( cwd = process.cwd() ) {
	const { stdout } = await execa( 'git', [ 'rev-parse', 'HEAD' ], { cwd } );
	return stdout.trim();
}

/**
 * Get files changed for a project between two refs.
 *
 * If `since` is null, returns null (caller treats as "no stamp, needs full build").
 * If `since` equals current HEAD, returns an empty array.
 *
 * @param {string}      slug  - Project slug.
 * @param {string|null} since - Base ref (a SHA), or null.
 * @param {string}      [cwd] - Monorepo root.
 * @return {Promise<string[]|null>} Changed file paths (repo-relative), or null when no baseline exists.
 */
export async function getChangedFiles( slug, since, cwd = process.cwd() ) {
	if ( ! since ) {
		return null;
	}
	const projectPath = slug === 'monorepo' ? '.' : `projects/${ slug }`;
	try {
		const { stdout } = await execa(
			'git',
			[
				'-c',
				'core.quotepath=off',
				'diff',
				'--no-renames',
				'--name-only',
				since,
				'HEAD',
				'--',
				projectPath,
			],
			{ cwd }
		);
		return stdout.split( '\n' ).filter( Boolean );
	} catch ( e ) {
		// Stale SHA (e.g. branch was rebased) — caller should treat as "needs full build".
		if ( /unknown revision|bad object|ambiguous argument/i.test( e.stderr || e.message || '' ) ) {
			return null;
		}
		throw e;
	}
}

/**
 * Bucket changed files into work categories for a project (sync, no JSON-aware diff).
 *
 * Treats any composer.json/package.json change as a deps change. Prefer
 * inspectProjectChanges() for planning; this helper exists for tests and
 * for callers that don't have a `since` ref.
 *
 * @param {string[]} files - Changed files (repo-relative).
 * @return {object} Bucket flags (booleans): composerRequire, phpAutoload, jsDeps, jsSources, other, none.
 */
export function classifyChanges( files ) {
	const out = {
		composerRequire: false,
		phpAutoload: false,
		jsDeps: false,
		jsSources: false,
		other: false,
		none: false,
	};
	if ( ! files || files.length === 0 ) {
		out.none = true;
		return out;
	}
	for ( const file of files ) {
		const base = path.basename( file );
		if ( base === 'composer.json' || base === 'composer.lock' ) {
			out.composerRequire = true;
		} else if ( base === 'package.json' ) {
			out.jsDeps = true;
		} else if ( /\.php$/i.test( file ) ) {
			out.phpAutoload = true;
		} else if ( /\.(jsx?|tsx?|mjs|cjs|s?css|less)$/i.test( file ) ) {
			out.jsSources = true;
		} else if ( /webpack(\.config)?\.(js|cjs|mjs|ts)$/i.test( base ) ) {
			out.jsSources = true;
		} else if ( /\.(json|svg|png|jpg|gif|woff2?|ttf)$/i.test( file ) ) {
			// Asset-ish — treat as JS source so bundlers re-emit.
			out.jsSources = true;
		} else {
			out.other = true;
		}
	}
	return out;
}

/**
 * Read a file's contents at a specific git ref, returning null if it didn't exist there.
 *
 * @param {string} ref  - Git ref.
 * @param {string} file - Repo-relative file path.
 * @param {string} cwd  - Repo root.
 * @return {Promise<string|null>} File contents, or null when missing at ref.
 */
async function readAtRef( ref, file, cwd ) {
	try {
		const { stdout } = await execa( 'git', [ 'show', `${ ref }:${ file }` ], { cwd } );
		return stdout;
	} catch {
		return null;
	}
}

/**
 * Compare two values for deep structural equality after canonical-JSON serialization.
 *
 * @param {unknown} a - First value.
 * @param {unknown} b - Second value.
 * @return {boolean} Whether the two values serialize identically with sorted keys.
 */
function deepEqualJson( a, b ) {
	const canon = v => JSON.stringify( v, Object.keys( v || {} ).sort() );
	return canon( a ) === canon( b );
}

/**
 * Decide whether a composer.json change touched anything that affects autoload/install.
 *
 * Only the `require`, `require-dev`, `autoload`, `autoload-dev`, and
 * `extra.dependencies` blocks matter for runtime — a `version` or
 * description-only bump should not trigger `composer install`.
 *
 * @param {string} file  - Repo-relative path to composer.json.
 * @param {string} since - Base ref.
 * @param {string} cwd   - Repo root.
 * @return {Promise<{ requireChanged: boolean, autoloadChanged: boolean }>} Diff verdict.
 */
async function composerJsonDiff( file, since, cwd ) {
	const [ oldRaw, newRaw ] = await Promise.all( [
		readAtRef( since, file, cwd ),
		fs.readFile( path.join( cwd, file ), { encoding: 'utf8' } ).catch( () => null ),
	] );
	// If we can't read one side, be conservative and treat as changed.
	if ( ! oldRaw || ! newRaw ) {
		return { requireChanged: true, autoloadChanged: true };
	}
	let oldJson, newJson;
	try {
		oldJson = JSON.parse( oldRaw );
		newJson = JSON.parse( newRaw );
	} catch {
		return { requireChanged: true, autoloadChanged: true };
	}
	const requireChanged =
		! deepEqualJson( oldJson.require, newJson.require ) ||
		! deepEqualJson( oldJson[ 'require-dev' ], newJson[ 'require-dev' ] ) ||
		! deepEqualJson( oldJson.extra?.dependencies, newJson.extra?.dependencies );
	const autoloadChanged =
		! deepEqualJson( oldJson.autoload, newJson.autoload ) ||
		! deepEqualJson( oldJson[ 'autoload-dev' ], newJson[ 'autoload-dev' ] );
	return { requireChanged, autoloadChanged };
}

/**
 * Decide whether a package.json change touched anything that affects pnpm install.
 *
 * Only the dependency blocks and `scripts` matter; `version` bumps don't.
 *
 * @param {string} file  - Repo-relative path to package.json.
 * @param {string} since - Base ref.
 * @param {string} cwd   - Repo root.
 * @return {Promise<boolean>} Whether `pnpm install` is warranted.
 */
async function packageJsonDepsChanged( file, since, cwd ) {
	const [ oldRaw, newRaw ] = await Promise.all( [
		readAtRef( since, file, cwd ),
		fs.readFile( path.join( cwd, file ), { encoding: 'utf8' } ).catch( () => null ),
	] );
	if ( ! oldRaw || ! newRaw ) {
		return true;
	}
	let oldJson, newJson;
	try {
		oldJson = JSON.parse( oldRaw );
		newJson = JSON.parse( newRaw );
	} catch {
		return true;
	}
	const blocks = [ 'dependencies', 'devDependencies', 'peerDependencies', 'optionalDependencies' ];
	for ( const block of blocks ) {
		if ( ! deepEqualJson( oldJson[ block ], newJson[ block ] ) ) {
			return true;
		}
	}
	return ! deepEqualJson( oldJson.scripts, newJson.scripts );
}

/**
 * Async, JSON-aware variant of classifyChanges.
 *
 * Inspects composer.json / package.json contents at `since` vs. HEAD so that
 * a pure version bump no longer triggers a full install. The remaining file
 * patterns are bucketed identically to classifyChanges().
 *
 * @param {string} slug  - Project slug.
 * @param {string} since - Base ref (a SHA or symbolic ref).
 * @param {string} [cwd] - Monorepo root.
 * @return {Promise<object>} Bucket flags (booleans): composerRequire, phpAutoload, jsDeps, jsSources, other, none, missing. `missing: true` indicates the base ref is unreachable.
 */
export async function inspectProjectChanges( slug, since, cwd = process.cwd() ) {
	const out = {
		composerRequire: false,
		phpAutoload: false,
		jsDeps: false,
		jsSources: false,
		other: false,
		none: false,
		missing: false,
	};
	const files = await getChangedFiles( slug, since, cwd );
	if ( files === null ) {
		out.missing = true;
		return out;
	}
	if ( files.length === 0 ) {
		out.none = true;
		return out;
	}
	for ( const file of files ) {
		const base = path.basename( file );
		if ( base === 'composer.json' ) {
			const diff = await composerJsonDiff( file, since, cwd );
			out.composerRequire = out.composerRequire || diff.requireChanged;
			// An autoload-block change is fixed by dump-autoload, no install needed.
			out.phpAutoload = out.phpAutoload || diff.autoloadChanged;
		} else if ( base === 'composer.lock' ) {
			out.composerRequire = true;
		} else if ( base === 'package.json' ) {
			out.jsDeps = out.jsDeps || ( await packageJsonDepsChanged( file, since, cwd ) );
		} else if ( /\.php$/i.test( file ) ) {
			out.phpAutoload = true;
		} else if ( /\.(jsx?|tsx?|mjs|cjs|s?css|less)$/i.test( file ) ) {
			out.jsSources = true;
		} else if ( /webpack(\.config)?\.(js|cjs|mjs|ts)$/i.test( base ) ) {
			out.jsSources = true;
		} else if ( /\.(json|svg|png|jpg|gif|woff2?|ttf)$/i.test( file ) ) {
			out.jsSources = true;
		} else {
			out.other = true;
		}
	}
	if (
		! out.composerRequire &&
		! out.phpAutoload &&
		! out.jsDeps &&
		! out.jsSources &&
		! out.other
	) {
		out.none = true;
	}
	return out;
}
