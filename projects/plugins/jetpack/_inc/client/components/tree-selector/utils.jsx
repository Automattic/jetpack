/**
 * Builds a nested tree structure from a flat array of objects with ID, parent, and name properties.
 *
 * @param {Array} items - Array of objects containing at least ID, parent, and name.
 * @returns {Array} tree - Array of objects containing children as an array.
 */
function buildNestedTreeItems( items ) {
	const map = {},
		nestedTreeItems = [];

	// First pass: create a map of all items by their ID
	items.forEach( item => {
		map[ item.ID ] = { ...item, children: [] };
	} );

	// Second pass: build the nested tree items
	items.forEach( item => {
		if ( item.parent === 0 ) {
			nestedTreeItems.push( map[ item.ID ] );
		} else if ( map[ item.parent ] ) {
			map[ item.parent ].children.push( map[ item.ID ] );
		}
	} );

	return nestedTreeItems;
}

export { buildNestedTreeItems };
