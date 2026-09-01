/**
 * Generate a unique id by appending an incrementing numeric suffix when needed.
 *
 * @param {string}   baseId  - Base id (e.g., 'name', 'first-name', 'last-name')
 * @param {string[]} usedIds - List of ids already in use
 * @return {string} Unique id, e.g., 'name', 'name-2', 'name-3'
 */
export function generateUniqueFormFieldId( baseId, usedIds ) {
	if ( ! baseId ) {
		return '';
	}
	if ( ! Array.isArray( usedIds ) || ! usedIds.includes( baseId ) ) {
		return baseId;
	}
	let i = 2;
	while ( usedIds.includes( `${ baseId }-${ i }` ) ) {
		i++;
	}
	return `${ baseId }-${ i }`;
}
