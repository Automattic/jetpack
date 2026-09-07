import { resolveParentId } from './process-hierarchy-levels';

/**
 * Drop the descendants of every collapsed row from hierarchy-ordered rows.
 *
 * Rows must be in depth-first order so descendants immediately follow their parent.
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
 * Find the ids of rows with children in the provided data.
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
		const parentId = resolveParentId( getItemParentId( item ) );

		if ( parentId === undefined ) {
			continue;
		}

		if ( parentId !== getItemId( item ) && presentIds.has( parentId ) ) {
			parentIds.add( parentId );
		}
	}

	return parentIds;
}

/**
 * Collect the ancestors of the given rows, stopping at missing parents or cycles.
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
			const parentId = resolveParentId( getItemParentId( current ) );

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
