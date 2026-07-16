/**
 * One row of the resolved hierarchy: the item plus its depth.
 */
export interface HierarchyRow< Item > {
	item: Item;
	id: string;
	level: number;
}

type ProcessedHierarchyLevels< Item > = {
	/** The items re-emitted in depth-first hierarchy order. */
	data: Item[];
	/** Depth per row id, for DataViews' `getItemLevel`. */
	levelById: ReadonlyMap< string, number >;
};

/**
 * Resolve flat parent/child rows into what DataViews' native hierarchy
 * support consumes: the rows re-emitted in depth-first hierarchy order, and a
 * depth per row id for `getItemLevel`.
 *
 * This is the only preprocessing the native `view.showLevels` rendering
 * needs — DataViews displays the level marker per row but does not order the
 * rows itself, so consumers (like the Gutenberg Pages screen) supply both.
 * Rows whose parent is absent from the data (or self-referential) become
 * roots.
 *
 * @param data            - Flat rows: parents and children mixed.
 * @param getItemId       - Row id resolver.
 * @param getItemParentId - Parent id resolver.
 * @return The hierarchy-ordered items and the depth per row id.
 */
export function processHierarchyLevels< Item >(
	data: Item[],
	getItemId: ( item: Item ) => string,
	getItemParentId: ( item: Item ) => string | number | null | undefined
): ProcessedHierarchyLevels< Item > {
	const rows: HierarchyRow< Item >[] = data.map( ( item, index ) => ( {
		item,
		id: getItemId( item ) || index.toString(),
		level: 0,
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
	const levelById = new Map< string, number >();
	const appendRows = ( pending: HierarchyRow< Item >[], level: number ) => {
		for ( const row of pending ) {
			if ( levelById.has( row.id ) ) {
				continue;
			}

			levelById.set( row.id, level );
			orderedData.push( row.item );
			appendRows( childrenByParentId.get( row.id ) ?? [], level + 1 );
		}
	};

	appendRows( roots, 0 );

	// Rows caught in a parent cycle have no reachable root; emit them (and
	// their descendants) as roots instead of dropping them.
	for ( const row of rows ) {
		if ( ! levelById.has( row.id ) ) {
			appendRows( [ row ], 0 );
		}
	}

	return { data: orderedData, levelById };
}
