/* global GitHub */
const debug = require( './debug' );

// Cache for getDiff.
const cache = {};

/**
 * Remove unwanted file diffs (e.g., lockfiles) from a GitHub diff string.
 *
 * GitHub diffs are composed of per-file blocks starting with:
 * `diff --git a/<path> b/<path>`
 *
 * @param {string} diff - Full diff string from GitHub.
 * @return {string} Filtered diff string.
 */
function filterDiff( diff ) {
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
	const keptLines = [];

	let currentFileHeader = null;
	let currentBlock = [];

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

		const shouldIgnore = ignoredFilenames.has( filenameA ) || ignoredFilenames.has( filenameB );

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
 * @param {GitHub} octokit - Initialized Octokit REST client.
 * @param {string} owner   - Repository owner.
 * @param {string} repo    - Repository name.
 * @param {number} number  - PR number.
 * @param {number} maxSize - Maximum size of diff to return (default 50000 characters).
 * @return {Promise<string>} Promise resolving to the PR diff as a string, truncated to maxSize.
 * @throws {Error} Throws an error if the API request fails or if the PR cannot be fetched.
 */
async function getDiff( octokit, owner, repo, number, maxSize = 50000 ) {
	const cacheKey = `${ owner }/${ repo } #${ number }`;
	if ( cache[ cacheKey ] ) {
		debug( `get-diff: Returning diff for ${ cacheKey } from cache.` );
		return cache[ cacheKey ];
	}

	debug( `get-diff: Fetching diff for ${ cacheKey }.` );

	const response = await octokit.rest.pulls.get( {
		owner,
		repo,
		pull_number: +number,
		mediaType: {
			format: 'diff',
		},
	} );

	let diff = response.data;

	if ( typeof diff !== 'string' ) {
		debug(
			`get-diff: Expected diff to be a string but received ${ typeof diff }. Returning empty diff.`
		);
		diff = '';
	}

	// Remove unwanted file blocks (e.g., lockfiles) before further processing/truncation.
	diff = filterDiff( diff );

	// Filter out lines longer than 500 characters (likely minified code).
	diff = diff
		.split( '\n' )
		.filter( line => line.length <= 500 )
		.join( '\n' );

	// Truncate if too large.
	if ( diff.length > maxSize ) {
		debug( `get-diff: Truncating diff from ${ diff.length } to ${ maxSize } characters.` );
		diff = diff.substring( 0, maxSize );
	}

	cache[ cacheKey ] = diff;
	return diff;
}

module.exports = getDiff;
