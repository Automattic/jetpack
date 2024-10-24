type ParsedFilename = {
	prefix: string;
	path: string;
};

const decompose = ( path: string ): ParsedFilename => {
	const lastSlash = path.lastIndexOf( '/' );

	return lastSlash > -1
		? { prefix: path.slice( 0, lastSlash ), path: path.slice( lastSlash ) }
		: { prefix: '', path };
};

/**
 * Parse the filename from a diff
 *
 * Uses a heuristic to return proper file name indicators
 *
 * It searches for the longest shared prefix and returns
 * whatever remains after that. If the paths are identical
 * it only returns a single filename as we have detected
 * that the diff compares changes to only one file.
 *
 * An exception is made for `a/` and `b/` prefixes often
 * added by `git` and other utilities to separate the left
 * from the right when looking at the contents of a single
 * file over time.
 *
 * @param {string} prev - filename of left contents
 * @param {string} next - filename of right contents
 *
 * @return {object} - parsed filename
 */
export default function (
	prev: string,
	next: string
): { prev: ParsedFilename; next: ParsedFilename } {
	// Remove 'a/' and 'b/' prefixes if present
	const isLikelyPrefixed = prev.startsWith( 'a/' ) && next.startsWith( 'b/' );
	prev = isLikelyPrefixed ? prev.slice( 2 ) : prev;
	next = isLikelyPrefixed ? next.slice( 2 ) : next;

	if ( prev === next ) {
		// Paths are identical
		const { prefix, path } = decompose( prev );
		return { prev: { prefix, path }, next: { prefix, path } };
	}

	// Find longest shared base path ending with a slash
	const length = Math.max( prev.length, next.length );
	for ( let i = 0, slash = 0; i < length; i++ ) {
		if ( prev[ i ] === '/' && next[ i ] === '/' ) {
			slash = i;
		}

		if ( prev[ i ] !== next[ i ] ) {
			return {
				prev: {
					prefix: prev.slice( 0, slash ),
					path: prev.slice( slash ),
				},
				next: {
					prefix: next.slice( 0, slash ),
					path: next.slice( slash ),
				},
			};
		}
	}

	// No shared base path
	return {
		prev: decompose( prev ),
		next: decompose( next ),
	};
}
