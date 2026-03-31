import { access, readFile } from 'node:fs/promises';
import { join, dirname, relative } from 'node:path';
import type { DiscoveredFile } from './discovery.js';

export interface PathReference {
	path: string;
	exists: boolean;
	referencedIn: string;
}

export interface CommandReference {
	command: string;
	found: boolean;
	foundIn: string | null;
	referencedIn: string;
}

export interface ValidationResult {
	referencedPaths: PathReference[];
	referencedCommands: CommandReference[];
}

/**
 * Extracts file/directory paths from markdown content.
 * Looks for backtick-wrapped paths that look like filesystem references.
 * @param content - Markdown content to search for path references.
 * @return Array of extracted filesystem paths.
 */
function extractReferencedPaths( content: string ): string[] {
	const paths = new Set< string >();

	// Match backtick-wrapped paths: `src/foo/bar.ts`, `packages/my-pkg/`
	const backtickPattern = /`([a-zA-Z0-9_./-]{2,}(?:\.[a-zA-Z0-9]+)?)`/g;
	for ( const match of content.matchAll( backtickPattern ) ) {
		const candidate = match[ 1 ];

		// Must contain a slash (looks like a path, not a variable name)
		if ( ! candidate.includes( '/' ) ) {
			continue;
		}
		// Skip URLs
		if ( candidate.startsWith( 'http' ) || candidate.startsWith( '//' ) ) {
			continue;
		}
		// Skip package names like @scope/pkg
		if ( candidate.startsWith( '@' ) && ! candidate.includes( '/' + '/' ) ) {
			// Allow if it has a second slash (e.g., @scope/pkg/src/file.ts)
			const slashCount = ( candidate.match( /\//g ) || [] ).length;
			if ( slashCount < 2 ) {
				continue;
			}
		}

		paths.add( candidate );
	}

	return [ ...paths ];
}

/**
 * Extracts commands referenced in markdown content.
 * Looks for pnpm/npm/yarn/make/composer commands.
 * @param content - Markdown content to search for command references.
 * @return Array of extracted command names.
 */
function extractReferencedCommands( content: string ): string[] {
	const commands = new Set< string >();

	// Match: pnpm run X, npm run X, yarn run X, pnpm X, npm X
	const npmPattern = /(?:pnpm|npm|yarn)\s+(?:run\s+)?([a-zA-Z0-9_:-]+)/g;
	for ( const match of content.matchAll( npmPattern ) ) {
		const cmd = match[ 1 ];
		// Skip common subcommands that aren't scripts
		if (
			[
				'install',
				'ci',
				'init',
				'publish',
				'pack',
				'link',
				'exec',
				'dlx',
				'add',
				'remove',
			].includes( cmd )
		) {
			continue;
		}
		commands.add( cmd );
	}

	// Match: make X, composer X, jp X (Jetpack monorepo CLI)
	const makePattern = /(?:make|composer|jp|jetpack)\s+([a-zA-Z0-9_:-]+)/g;
	for ( const match of content.matchAll( makePattern ) ) {
		commands.add( match[ 1 ] );
	}

	return [ ...commands ];
}

/**
 * Checks a single directory for a command in package.json scripts,
 * Makefile targets, or composer.json scripts.
 *
 * @param dir     - Absolute path to the directory to check.
 * @param command - Command name to search for.
 * @return The filename where found (e.g., "package.json"), or null.
 */
async function checkDirForCommand( dir: string, command: string ): Promise< string | null > {
	// Check package.json scripts
	try {
		const pkgJson = JSON.parse( await readFile( join( dir, 'package.json' ), 'utf-8' ) );
		if ( pkgJson.scripts?.[ command ] ) {
			return 'package.json';
		}
	} catch {
		// No package.json or invalid JSON
	}

	// Check Makefile targets
	try {
		const makefile = await readFile( join( dir, 'Makefile' ), 'utf-8' );
		const targetPattern = new RegExp( `^${ command }\\s*:`, 'm' );
		if ( targetPattern.test( makefile ) ) {
			return 'Makefile';
		}
	} catch {
		// No Makefile
	}

	// Check composer.json scripts
	try {
		const composerJson = JSON.parse( await readFile( join( dir, 'composer.json' ), 'utf-8' ) );
		if ( composerJson.scripts?.[ command ] ) {
			return 'composer.json';
		}
	} catch {
		// No composer.json or invalid JSON
	}

	return null;
}

/**
 * Finds where a command is defined, searching from the instruction file's
 * directory up to the repo root. This handles monorepos where commands are
 * defined in subproject manifests.
 *
 * @param repoRoot        - Absolute path to the repository root.
 * @param command         - Command name to search for.
 * @param referencedInDir - Directory of the instruction file that references this command.
 * @return Relative path to the file where the command was found, or null.
 */
async function findCommandSource(
	repoRoot: string,
	command: string,
	referencedInDir: string
): Promise< string | null > {
	// Walk from the instruction file's directory up to (and including) repo root
	let current = join( repoRoot, referencedInDir );

	while ( true ) {
		const found = await checkDirForCommand( current, command );
		if ( found ) {
			return join( relative( repoRoot, current ), found );
		}

		// Stop at repo root
		if ( current === repoRoot ) {
			break;
		}

		const parent = dirname( current );
		// Safety: stop if we can't go higher
		if ( parent === current ) {
			break;
		}
		current = parent;
	}

	return null;
}

/**
 * Cross-references claims in AI instruction files against the actual codebase.
 *
 * @param repoRoot - Absolute path to the repository root.
 * @param files    - Discovered AI instruction files to validate.
 * @return Validation results with path and command references.
 */
export async function validateCurrency(
	repoRoot: string,
	files: DiscoveredFile[]
): Promise< ValidationResult > {
	const referencedPaths: PathReference[] = [];
	const referencedCommands: CommandReference[] = [];

	for ( const file of files ) {
		const pathRefs = extractReferencedPaths( file.content );
		for ( const p of pathRefs ) {
			let exists = false;
			try {
				await access( join( repoRoot, p ) );
				exists = true;
			} catch {
				// Path doesn't exist
			}
			referencedPaths.push( {
				path: p,
				exists,
				referencedIn: file.relativePath,
			} );
		}

		const cmdRefs = extractReferencedCommands( file.content );
		const fileDir = dirname( file.relativePath );
		for ( const cmd of cmdRefs ) {
			const foundIn = await findCommandSource( repoRoot, cmd, fileDir );
			referencedCommands.push( {
				command: cmd,
				found: foundIn !== null,
				foundIn,
				referencedIn: file.relativePath,
			} );
		}
	}

	return { referencedPaths, referencedCommands };
}
