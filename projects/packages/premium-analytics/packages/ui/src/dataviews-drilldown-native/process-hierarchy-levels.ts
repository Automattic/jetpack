/**
 * One row of the hierarchy walk: the item plus its resolved id.
 */
interface HierarchyRow< Item > {
	item: Item;
	id: string;
}

/**
 * Normalise a `getItemParentId` result to the string ids the walks compare, or
 * `undefined` for a row with no parent.
 */
export function resolveParentId(
	rawParentId: string | number | null | undefined
): string | undefined {
	return rawParentId === null || rawParentId === undefined ? undefined : rawParentId.toString();
}

type ProcessedHierarchyLevels< Item > = {
	/** The items re-emitted in depth-first hierarchy order. */
	data: Item[];
	/**
	 * Depth per item id, for `getItemLevel`. Keyed by id, not item identity:
	 * DataViews clones each record internally, so `getItemLevel` never sees
	 * the objects this walk saw.
	 */
	levelById: ReadonlyMap< string, number >;
};

/**
 * Resolve flat parent/child rows into depth-first hierarchy order plus a
 * depth per item for `getItemLevel`. Rows with a missing or self-referential
 * parent become roots; no row is ever dropped, even on a cycle or id collision.
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
		const parentId = resolveParentId( getItemParentId( row.item ) );
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
	const visited = new Set< HierarchyRow< Item > >();
	const appendRows = ( pending: HierarchyRow< Item >[], level: number ) => {
		for ( const row of pending ) {
			if ( visited.has( row ) ) {
				continue;
			}

			visited.add( row );
			levelById.set( row.id, level );
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

	return { data: orderedData, levelById };
}

/**
 * Given matched row ids, return those rows plus their ancestors (so a
 * matching child stays under its parents) and descendants (so a matching
 * parent keeps its group) — never a match's siblings. Cycle-safe.
 *
 * @param data            - The full flat rows.
 * @param matchedIds      - Ids (from `getItemId`) of the rows that matched.
 * @param getItemId       - Row id resolver.
 * @param getItemParentId - Parent id resolver.
 * @return The matched rows plus ancestors and descendants, in `data` order.
 */
export function withHierarchyContext< Item >(
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
			const parentId = resolveParentId( getItemParentId( current ) );

			// Stop at a root, self-referential parent, or one already kept — the
			// last also breaks cycles, since a kept id's ancestors are already collected.
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

	const childIdsByParentId = new Map< string, string[] >();
	for ( const item of data ) {
		const id = getItemId( item );
		const parentId = resolveParentId( getItemParentId( item ) );

		if ( ! parentId || parentId === id ) {
			continue;
		}

		const siblingIds = childIdsByParentId.get( parentId ) ?? [];
		siblingIds.push( id );
		childIdsByParentId.set( parentId, siblingIds );
	}

	// Walk down from the matches only — seeding from `keep` would sweep in the
	// ancestors' other branches.
	const pending = [ ...matchedIds ];
	const visited = new Set< string >();
	while ( pending.length ) {
		const id = pending.pop() as string;

		if ( visited.has( id ) ) {
			continue;
		}

		visited.add( id );

		for ( const childId of childIdsByParentId.get( id ) ?? [] ) {
			keep.add( childId );
			pending.push( childId );
		}
	}

	return data.filter( item => keep.has( getItemId( item ) ) );
}
