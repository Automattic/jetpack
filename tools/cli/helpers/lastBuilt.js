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
 * Path to a project's stamp file for a given kind.
 *
 * Two kinds are tracked independently:
 * - `build`: project was fully built at this SHA (JS + PHP autoload).
 * - `autoload`: project's autoloader classmap was regenerated at this SHA (PHP only).
 *
 * Tracking them separately prevents a cheap `dump-autoload` from making future
 * runs blind to stale JS bundles that were never rebuilt.
 *
 * @param {string} slug  - Project slug (e.g. "plugins/jetpack").
 * @param {string} kind  - "build" or "autoload".
 * @param {string} [cwd] - Monorepo root.
 * @return {string} Absolute path.
 */
function stampPath( slug, kind, cwd = process.cwd() ) {
	const safe = slug.replace( /\//g, '__' );
	return path.join( stampDir( cwd ), `${ safe }.${ kind }.sha` );
}

/**
 * Read a single stamp SHA, returning null when missing.
 *
 * @param {string} file - Absolute stamp path.
 * @return {Promise<string|null>} The SHA, or null if no stamp exists.
 */
async function readSha( file ) {
	try {
		const data = await fs.readFile( file, { encoding: 'utf8' } );
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
 * Read both stamp kinds for a project.
 *
 * @param {string} slug  - Project slug.
 * @param {string} [cwd] - Monorepo root.
 * @return {Promise<{ build: string|null, autoload: string|null }>} Both SHAs.
 */
export async function readStamps( slug, cwd = process.cwd() ) {
	const [ build, autoload ] = await Promise.all( [
		readSha( stampPath( slug, 'build', cwd ) ),
		readSha( stampPath( slug, 'autoload', cwd ) ),
	] );
	return { build, autoload };
}

/**
 * Write a stamp of the given kind.
 *
 * `writeStamp(slug, sha, 'build')` also updates the autoload stamp, since a
 * full build implies the autoloader was regenerated as part of it.
 * `writeStamp(slug, sha, 'autoload')` only updates the autoload stamp.
 *
 * @param {string} slug  - Project slug.
 * @param {string} sha   - Git SHA to record.
 * @param {string} kind  - "build" or "autoload".
 * @param {string} [cwd] - Monorepo root.
 */
export async function writeStamp( slug, sha, kind, cwd = process.cwd() ) {
	if ( kind !== 'build' && kind !== 'autoload' ) {
		throw new Error( `Unknown stamp kind: ${ kind }` );
	}
	await fs.mkdir( stampDir( cwd ), { recursive: true } );
	const writes = [
		fs.writeFile( stampPath( slug, 'autoload', cwd ), sha + '\n', { encoding: 'utf8' } ),
	];
	if ( kind === 'build' ) {
		writes.push(
			fs.writeFile( stampPath( slug, 'build', cwd ), sha + '\n', { encoding: 'utf8' } )
		);
	}
	await Promise.all( writes );
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
 * Bucket one set of changed files. Pure helper, no IO besides the JSON-aware
 * composer.json / package.json checks.
 *
 * @param {string[]} files - Changed file paths.
 * @param {string}   since - Base ref used to derive `files` (needed for JSON diffs).
 * @param {string}   cwd   - Monorepo root.
 * @return {Promise<object>} Same shape as classifyChanges (no `missing` field).
 */
async function bucketFiles( files, since, cwd ) {
	const out = {
		composerRequire: false,
		phpAutoload: false,
		jsDeps: false,
		jsSources: false,
		other: false,
		none: false,
	};
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

/**
 * Async, JSON-aware variant of classifyChanges.
 *
 * Accepts both a build baseline and an autoload baseline (typically the same
 * SHA for fresh-built projects, or different SHAs when a previous fast-build
 * regenerated the autoloader but didn't rebuild JS). The autoload-only buckets
 * (`phpAutoload`) are derived from `sinceAutoload`; everything else from
 * `sinceBuild`. When the two baselines are equal the function makes one git
 * diff call.
 *
 * @param {string} slug      - Project slug.
 * @param {object} baselines - `{ sinceBuild, sinceAutoload }` (each a SHA or null).
 * @param {string} [cwd]     - Monorepo root.
 * @return {Promise<object>} Bucket flags (booleans): composerRequire, phpAutoload, jsDeps, jsSources, other, none, missing. `missing: true` indicates the build baseline is unreachable.
 */
export async function inspectProjectChanges( slug, baselines, cwd = process.cwd() ) {
	const out = {
		composerRequire: false,
		phpAutoload: false,
		jsDeps: false,
		jsSources: false,
		other: false,
		none: false,
		missing: false,
	};
	const { sinceBuild, sinceAutoload } = baselines;
	if ( ! sinceBuild ) {
		// No build baseline → caller treats as "skip" (no stamp = never built by us).
		out.missing = true;
		return out;
	}
	const filesBuild = await getChangedFiles( slug, sinceBuild, cwd );
	if ( filesBuild === null ) {
		out.missing = true;
		return out;
	}
	const baseAutoload = sinceAutoload || sinceBuild;
	let filesAutoload = filesBuild;
	if ( baseAutoload !== sinceBuild ) {
		const fromAutoload = await getChangedFiles( slug, baseAutoload, cwd );
		if ( fromAutoload !== null ) {
			filesAutoload = fromAutoload;
		}
	}
	const buckBuild = await bucketFiles( filesBuild, sinceBuild, cwd );
	const buckAutoload =
		filesAutoload === filesBuild
			? buckBuild
			: await bucketFiles( filesAutoload, baseAutoload, cwd );

	// jsSources / jsDeps / composerRequire / other / none come from the build baseline.
	out.composerRequire = buckBuild.composerRequire;
	out.jsDeps = buckBuild.jsDeps;
	out.jsSources = buckBuild.jsSources;
	out.other = buckBuild.other;
	// phpAutoload is what's changed since the autoloader was last regenerated.
	out.phpAutoload = buckAutoload.phpAutoload;
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
