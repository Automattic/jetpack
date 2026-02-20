import debug from './debug.ts';
import type { OctokitClient } from '../types.ts';

// Cache for getDiff.
const cache: Record< string, string > = {};

/**
 * Remove unwanted file diffs (e.g., lockfiles) from a GitHub diff string.
 *
 * GitHub diffs are composed of per-file blocks starting with:
 * `diff --git a/<path> b/<path>`
 *
 * @param diff - Full diff string from GitHub.
 * @return Filtered diff string.
 */
function filterDiff( diff: string ): string {
	if ( ! diff ) {
		return '';
	}

	// Files we consider noise for "code change" analysis.
	const ignoredFilenames = new Set( [
		'composer.lock',
		'package-lock.json',
		'pnpm-workspace.yaml',
		'pnpm-lock.yaml',
		'yarn.lock',
	] );

	const lines = diff.split( '\n' );
	const keptLines: string[] = [];

	let currentFileHeader: string | null = null;
	let currentBlock: string[] = [];

	const flushBlock = () => {
		if ( ! currentBlock.length ) {
			return;
		}

		// If we can't detect the file header, keep the block (better safe than sorry).
		if ( ! currentFileHeader ) {
			keptLines.push( ...currentBlock );
			return;
		}

		// Parse `diff --git a/<path> b/<path>`.
		const match = currentFileHeader.match( /^diff --git a\/(.+?) b\/(.+?)\s*$/ );
		if ( ! match ) {
			keptLines.push( ...currentBlock );
			return;
		}

		const pathA = match[ 1 ];
		const pathB = match[ 2 ];
		const filenameA = pathA.split( '/' ).pop();
		const filenameB = pathB.split( '/' ).pop();

		const shouldIgnore = ignoredFilenames.has( filenameA! ) || ignoredFilenames.has( filenameB! );

		if ( shouldIgnore ) {
			debug( `get-diff: Removing diff block for ignored file "${ filenameB || filenameA }".` );
			return;
		}

		keptLines.push( ...currentBlock );
	};

	for ( const line of lines ) {
		if ( line.startsWith( 'diff --git ' ) ) {
			flushBlock();
			currentFileHeader = line;
			currentBlock = [ line ];
			continue;
		}
		currentBlock.push( line );
	}

	flushBlock();

	return keptLines.join( '\n' );
}

/**
 * Get the diff for a PR.
 *
 * Filters out lines longer than 500 characters (likely minified code)
 * removes diffs for lock files (noise for code analysis),
 * and truncates the result to maxSize characters.
 *
 * @param  octokit - Initialized Octokit REST client.
 * @param  owner   - Repository owner.
 * @param  repo    - Repository name.
 * @param  number  - PR number.
 * @param  maxSize - Maximum size of diff to return (default 50000 characters).
 * @return Promise resolving to the PR diff as a string, truncated to maxSize.
 * @throws {Error} Throws an error if the API request fails or if the PR cannot be fetched.
 */
async function getDiff(
	octokit: OctokitClient,
	owner: string,
	repo: string,
	number: number,
	maxSize: number = 50000
): Promise< string > {
	const cacheKey = `${ owner }/${ repo } #${ number }`;
	if ( cache[ cacheKey ] ) {
		debug( `get-diff: Returning diff for ${ cacheKey } from cache.` );
		return cache[ cacheKey ];
	}

	debug( `get-diff: Fetching diff for ${ cacheKey }.` );

	const response = await octokit.rest.pulls.get( {
		owner,
		repo,
		pull_number: number,
		mediaType: {
			format: 'diff',
		},
	} );

	// When using mediaType diff format, response.data is a string at runtime,
	// but Octokit types declare it as an object.
	let diff = response.data as unknown as string;

	if ( typeof diff !== 'string' ) {
		debug(
			`get-diff: Expected diff to be a string but received ${ typeof diff }. Returning empty diff.`
		);
		diff = '';
	}

	// Remove unwanted file blocks (e.g., lockfiles) before further processing/truncation.
	diff = filterDiff( diff );

	// Filter out very long content lines (likely minified code) while preserving diff structure.
	// We keep diff header lines (diff --, +++, ---, @@, etc.) regardless of length to avoid
	// breaking the diff format. Only actual content lines (starting with +, -, or space) are filtered.
	// Note: This may also filter legitimate long lines like inline SVG or long markdown paragraphs,
	// but such lines are typically not useful for AI analysis of user-facing changes.
	const maxLineLength = 500;
	let filteredLineCount = 0;
	diff = diff
		.split( '\n' )
		.filter( line => {
			// Always keep diff header lines to preserve structure
			if (
				line.startsWith( 'diff --git' ) ||
				line.startsWith( '---' ) ||
				line.startsWith( '+++' ) ||
				line.startsWith( '@@' ) ||
				line.startsWith( 'index ' ) ||
				line.startsWith( 'new file' ) ||
				line.startsWith( 'deleted file' ) ||
				line.startsWith( 'Binary files' )
			) {
				return true;
			}
			// Filter long content lines
			if ( line.length > maxLineLength ) {
				filteredLineCount++;
				return false;
			}
			return true;
		} )
		.join( '\n' );

	if ( filteredLineCount > 0 ) {
		debug(
			`get-diff: Filtered ${ filteredLineCount } lines longer than ${ maxLineLength } characters.`
		);
	}

	// Truncate if too large.
	if ( diff.length > maxSize ) {
		debug( `get-diff: Truncating diff from ${ diff.length } to ${ maxSize } characters.` );
		diff = diff.substring( 0, maxSize );
	}

	cache[ cacheKey ] = diff;
	return diff;
}

export default getDiff;
