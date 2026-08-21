/**
 * The collapse layer over the native level rendering.
 *
 * DataViews' `view.showLevels` is a static display: it marks each row's depth
 * but has no notion of a folded branch. Everything needed to fold one lives in
 * this module, so it can be deleted wholesale once core ships native collapse
 * (WordPress/gutenberg#80360).
 */

/**
 * Drop the descendants of every collapsed row from hierarchy-ordered rows.
 *
 * The rows arrive depth-first, so a branch is exactly the run of rows deeper
 * than its parent that follows it: once a collapsed row is seen, skip until the
 * depth returns to that row's own level or shallower. A collapsed leaf hides
 * nothing, since no deeper row follows it.
 *
 * @param orderedData - Rows in depth-first hierarchy order.
 * @param getItemId   - Row id resolver.
 * @param levelById   - Depth per row id; a row with no entry counts as a root.
 * @param isExpanded  - Whether the row with this id is currently expanded.
 * @return The rows that stay visible, in the same order.
 */
export function filterCollapsedRows< Item >(
	orderedData: Item[],
	getItemId: ( item: Item ) => string,
	levelById: ReadonlyMap< string, number >,
	isExpanded: ( id: string ) => boolean
): Item[] {
	const visible: Item[] = [];
	let hideDeeperThan: number | null = null;

	for ( const item of orderedData ) {
		const id = getItemId( item );
		const level = levelById.get( id ) ?? 0;

		if ( hideDeeperThan !== null && level > hideDeeperThan ) {
			continue;
		}

		hideDeeperThan = isExpanded( id ) ? null : level;
		visible.push( item );
	}

	return visible;
}

/**
 * Resolve which rows a chevron belongs on: the ids that at least one other row
 * names as its parent.
 *
 * Derived from the rows on screen rather than taken from a flag on the record,
 * so a parent whose children a filter removed stops offering a toggle that
 * would fold nothing.
 *
 * @param data            - The rows to inspect.
 * @param getItemId       - Row id resolver.
 * @param getItemParentId - Parent id resolver.
 * @return The ids of rows that have children.
 */
export function findParentIds< Item >(
	data: Item[],
	getItemId: ( item: Item ) => string,
	getItemParentId: ( item: Item ) => string | number | null | undefined
): ReadonlySet< string > {
	const presentIds = new Set( data.map( getItemId ) );
	const parentIds = new Set< string >();

	for ( const item of data ) {
		const rawParentId = getItemParentId( item );

		if ( rawParentId === null || rawParentId === undefined ) {
			continue;
		}

		const parentId = rawParentId.toString();

		if ( parentId !== getItemId( item ) && presentIds.has( parentId ) ) {
			parentIds.add( parentId );
		}
	}

	return parentIds;
}

/**
 * Collect the ancestors of the given rows.
 *
 * A search or filter must not be answered by a blank table: if a match sits
 * under a folded parent, the collapse state has to yield. Force-expanding just
 * the matches' ancestors reveals each match in place while leaving every other
 * branch — and each match's own children — folded as the reader left them.
 *
 * The walk stops on a missing, self-referential, or already-collected id, so a
 * parent cycle terminates instead of looping.
 *
 * @param data            - The full rows.
 * @param ids             - Ids of the rows whose ancestors to collect.
 * @param getItemId       - Row id resolver.
 * @param getItemParentId - Parent id resolver.
 * @return The ancestor ids, excluding the given rows unless a cycle reaches them.
 */
export function collectAncestorIds< Item >(
	data: Item[],
	ids: ReadonlySet< string >,
	getItemId: ( item: Item ) => string,
	getItemParentId: ( item: Item ) => string | number | null | undefined
): ReadonlySet< string > {
	const itemById = new Map( data.map( item => [ getItemId( item ), item ] ) );
	const ancestorIds = new Set< string >();

	for ( const id of ids ) {
		let current = itemById.get( id );

		while ( current ) {
			const rawParentId = getItemParentId( current );
			const parentId =
				rawParentId === null || rawParentId === undefined ? undefined : rawParentId.toString();

			if ( ! parentId || parentId === getItemId( current ) || ancestorIds.has( parentId ) ) {
				break;
			}

			const parent = itemById.get( parentId );

			if ( ! parent ) {
				break;
			}

			ancestorIds.add( parentId );
			current = parent;
		}
	}

	return ancestorIds;
}
