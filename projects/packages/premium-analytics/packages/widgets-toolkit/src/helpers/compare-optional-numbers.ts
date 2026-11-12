/**
 * DataViews field `sort` for numbers that may be missing, keeping missing values last in
 * either direction. The default sort would call `localeCompare` on them and throw.
 *
 * DataViews hands `sort` the field values, not the items, despite its types.
 *
 * @param a         - One field value.
 * @param b         - The other field value.
 * @param direction - The sort direction.
 * @return The comparator result.
 */
export function compareOptionalNumbers(
	a: unknown,
	b: unknown,
	direction: 'asc' | 'desc'
): number {
	const aNumber = typeof a === 'number' ? a : undefined;
	const bNumber = typeof b === 'number' ? b : undefined;

	if ( aNumber === undefined || bNumber === undefined ) {
		return ( aNumber === undefined ? 1 : 0 ) - ( bNumber === undefined ? 1 : 0 );
	}

	return direction === 'asc' ? aNumber - bNumber : bNumber - aNumber;
}
