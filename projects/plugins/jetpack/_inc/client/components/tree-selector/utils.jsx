/**
 * Adds depth and parentNames property to an array of tree items.
 *
 * @param {Array} items - Array of objects containing at least id, parent, and name.
 * @returns {Array} flatList - Array of objects including a depth property and an array of parent names.
 */
function createFlatTreeItems( items ) {
	const map = {};
	const flatList = [];

	// First pass: create a map of all items by their id
	items.forEach( item => {
		map[ item.id ] = { ...item, children: [] };
	} );

	// Second pass: populate children for each item
	items.forEach( item => {
		if ( item.parent !== 0 && map[ item.parent ] ) {
			map[ item.parent ].children.push( item.id );
		}
	} );

	// Helper function to recursively process items, assign depth, and add to flat list
	// Now also collects parent names
	const processItem = ( id, depth, parentNames ) => {
		const item = map[ id ];
		const newItem = { ...item, depth, parentNames: [ ...parentNames ] };
		flatList.push( newItem );
		item.children.forEach( childId =>
			processItem( childId, depth + 1, [ ...parentNames, item.name ] )
		);
	};

	// Initialize processing for root items (those without parents or parent === 0)
	items.filter( item => item.parent === 0 ).forEach( item => processItem( item.id, 0, [] ) );

	// Remove children property as it's not required in the output
	return flatList.map( ( { children, ...item } ) => item );
}

export { createFlatTreeItems };
