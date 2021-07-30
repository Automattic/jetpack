/**
 * Given a set of strings, sort them by how fequently they occur in the set,
 * and return each unique string sorted from most frequent to least frequent.
 *
 * @param {string[]} strings Strings to sort by frequency
 */
export function sortByFrequency( strings: string[] ): string[] {
	const frequencyTable = strings.reduce( ( freq, next ) => {
		freq[ next ] = ( freq[ next ] || 0 ) + 1;
		return freq;
	}, {} );

	return Object.keys( frequencyTable ).sort( ( a, b ) =>
		frequencyTable[ a ] > frequencyTable[ b ] ? 1 : -1
	);
}
