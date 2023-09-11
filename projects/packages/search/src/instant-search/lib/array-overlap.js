/**
 * Finds the overlay between two arrays.
 *
 * @param {any[]} a1 - First array.
 * @param {any[]} a2 - Second array.
 * @returns {any[]} An array containing only overlaps/intersections.
 */
export default function arrayOverlap( a1, a2 ) {
	if ( ! Array.isArray( a1 ) ) {
		a1 = [ a1 ];
	}
	const intersection = a1.filter( value => a2.includes( value ) );
	return intersection.length !== 0;
}
