import { glob, readFile, lstat } from 'node:fs/promises';
import { join } from 'node:path';

export interface DiscoveredFile {
	relativePath: string;
	content: string;
	sizeBytes: number;
}

export interface DiscoveryOptions {
	/** Max file size in bytes. Files larger than this are skipped. Default: 100KB */
	maxFileSize?: number;
	/** Max number of files to return. Default: 200 */
	maxFileCount?: number;
	/** Additional directory names to exclude */
	exclude?: string[];
}

const AI_FILE_PATTERNS = [
	'**/CLAUDE.md',
	'**/AGENTS.md',
	'**/AGENTS.override.md',
	'**/.cursorrules',
	'**/.windsurfrules',
	'**/.aider.conf.yml',
	'**/.codeiumrc',
	'**/.github/copilot-instructions.md',
	'**/.claude/**',
	'**/.cursor/**',
	'**/.codex/**',
];

const DEFAULT_EXCLUDE = [ 'node_modules', '.git', 'vendor', 'dist', 'build', '.next' ];

/**
 * Finds and reads all AI instruction files in a repository.
 *
 * @param repoRoot - Absolute path to the repository root.
 * @param options  - Discovery options (max size, max count, excludes).
 * @return Discovered files sorted alphabetically by path.
 */
export async function discoverFiles(
	repoRoot: string,
	options: DiscoveryOptions = {}
): Promise< DiscoveredFile[] > {
	const { maxFileSize = 100 * 1024, maxFileCount = 200, exclude = [] } = options;

	const allExclude = [ ...DEFAULT_EXCLUDE, ...exclude ];
	const excludePatterns = allExclude.map( d => `**/${ d }/**` );
	const files: DiscoveredFile[] = [];

	for ( const pattern of AI_FILE_PATTERNS ) {
		if ( files.length >= maxFileCount ) {
			break;
		}

		const matches = await glob( pattern, {
			cwd: repoRoot,
			exclude: excludePatterns,
		} );

		for await ( const match of matches ) {
			if ( files.length >= maxFileCount ) {
				break;
			}

			// Skip duplicates from overlapping patterns
			if ( files.some( f => f.relativePath === match ) ) {
				continue;
			}

			const fullPath = join( repoRoot, match );

			let stat;
			try {
				stat = await lstat( fullPath );
			} catch {
				continue;
			}

			// Skip symlinks, directories, empty, and oversized files
			if ( ! stat.isFile() || stat.isSymbolicLink() ) {
				continue;
			}
			if ( stat.size === 0 || stat.size > maxFileSize ) {
				continue;
			}

			try {
				const content = await readFile( fullPath, 'utf-8' );
				files.push( { relativePath: match, content, sizeBytes: stat.size } );
			} catch {
				// Skip unreadable files (binary, permission errors)
				continue;
			}
		}
	}

	// Stable alphabetical sort for deterministic prompt construction
	return files.sort( ( a, b ) => a.relativePath.localeCompare( b.relativePath ) );
}
