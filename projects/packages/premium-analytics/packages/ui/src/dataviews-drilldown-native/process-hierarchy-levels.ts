/**
 * One row of the hierarchy walk: the item plus its resolved id.
 */
interface HierarchyRow< Item > {
	item: Item;
	id: string;
}

type ProcessedHierarchyLevels< Item > = {
	/** The items re-emitted in depth-first hierarchy order. */
	data: Item[];
	/** Depth per item, for DataViews' `getItemLevel`. */
	levelByItem: ReadonlyMap< Item, number >;
};

/**
 * Resolve flat parent/child rows into what DataViews' native hierarchy
 * support consumes: the rows re-emitted in depth-first hierarchy order, and a
 * depth per item for `getItemLevel`.
 *
 * This is the only preprocessing the native `view.showLevels` rendering
 * needs — DataViews displays the level marker per row but does not order the
 * rows itself, so consumers (like the Gutenberg Pages screen) supply both.
 * Rows whose parent is absent from the data (or self-referential) become
 * roots. Ids are expected to be stable, non-empty, and unique (DataViews
 * requires that too); colliding ids degrade the parent/child wiring, but no
 * row is ever dropped.
 *
 * @param data            - Flat rows: parents and children mixed.
 * @param getItemId       - Row id resolver.
 * @param getItemParentId - Parent id resolver.
 * @return The hierarchy-ordered items and the depth per item.
 */
export function processHierarchyLevels< Item >(
	data: Item[],
	getItemId: ( item: Item ) => string,
	getItemParentId: ( item: Item ) => string | number | null | undefined
): ProcessedHierarchyLevels< Item > {
	const rows: HierarchyRow< Item >[] = data.map( item => ( {
		item,
		id: getItemId( item ),
	} ) );
	const rowById = new Map( rows.map( row => [ row.id, row ] ) );
	const roots: HierarchyRow< Item >[] = [];
	const childrenByParentId = new Map< string, HierarchyRow< Item >[] >();

	for ( const row of rows ) {
		const rawParentId = getItemParentId( row.item );
		const parentId =
			rawParentId === null || rawParentId === undefined ? undefined : rawParentId.toString();
		const parent = parentId && parentId !== row.id ? rowById.get( parentId ) : undefined;

		if ( ! parent ) {
			roots.push( row );
			continue;
		}

		const children = childrenByParentId.get( parent.id ) ?? [];
		children.push( row );
		childrenByParentId.set( parent.id, children );
	}

	const orderedData: Item[] = [];
	const levelByItem = new Map< Item, number >();
	const visited = new Set< HierarchyRow< Item > >();
	const appendRows = ( pending: HierarchyRow< Item >[], level: number ) => {
		for ( const row of pending ) {
			if ( visited.has( row ) ) {
				continue;
			}

			visited.add( row );
			levelByItem.set( row.item, level );
			orderedData.push( row.item );
			appendRows( childrenByParentId.get( row.id ) ?? [], level + 1 );
		}
	};

	appendRows( roots, 0 );

	// Rows caught in a parent cycle have no reachable root; emit them (and
	// their descendants) as roots instead of dropping them.
	for ( const row of rows ) {
		if ( ! visited.has( row ) ) {
			appendRows( [ row ], 0 );
		}
	}

	return { data: orderedData, levelByItem };
}

/**
 * Given the ids of the rows a search or filter matched, return those rows plus
 * every ancestor up to a root, in the original `data` order (ready for
 * {@link processHierarchyLevels}). This keeps a filtered view's matches under
 * their parents instead of orphaning them. A missing, self-referential, or
 * already-kept parent ends the walk, so cycles cannot loop.
 *
 * @param data            - The full flat rows.
 * @param matchedIds      - Ids (from `getItemId`) of the rows that matched.
 * @param getItemId       - Row id resolver.
 * @param getItemParentId - Parent id resolver.
 * @return The matched rows plus their ancestors, in `data` order.
 */
export function withAncestors< Item >(
	data: Item[],
	matchedIds: ReadonlySet< string >,
	getItemId: ( item: Item ) => string,
	getItemParentId: ( item: Item ) => string | number | null | undefined
): Item[] {
	const itemById = new Map( data.map( item => [ getItemId( item ), item ] ) );
	const keep = new Set< string >( matchedIds );

	for ( const id of matchedIds ) {
		let current = itemById.get( id );

		while ( current ) {
			const rawParentId = getItemParentId( current );
			const parentId =
				rawParentId === null || rawParentId === undefined ? undefined : rawParentId.toString();

			// Stop at a root, a self-referential parent, or one already kept
			// (the last also breaks cycles, since a kept id's ancestors are
			// guaranteed collected).
			if ( ! parentId || parentId === getItemId( current ) || keep.has( parentId ) ) {
				break;
			}

			const parent = itemById.get( parentId );
			if ( ! parent ) {
				break;
			}

			keep.add( parentId );
			current = parent;
		}
	}

	return data.filter( item => keep.has( getItemId( item ) ) );
}
