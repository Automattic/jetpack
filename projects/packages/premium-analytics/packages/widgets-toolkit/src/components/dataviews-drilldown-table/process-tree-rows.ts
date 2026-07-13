/**
 * External dependencies
 */
import { filterSortAndPaginate, type Field, type View } from '@wordpress/dataviews';

/**
 * One row of the rendered tree: the item plus its resolved hierarchy metadata.
 */
export interface TreeRow< Item > {
	item: Item;
	id: string;
	depth: number;
	parentId?: string;
	childCount: number;
}

type PaginationInfo = { totalItems: number; totalPages: number };

type ProcessTreeRowsOptions< Item > = {
	getItemId: ( item: Item ) => string;
	getItemParentId: ( item: Item ) => string | number | null | undefined;
	fields: Field< Item >[];
};

type ProcessedTreeRows< Item > = {
	/** Rows to render, in hierarchy order, with collapsed subtrees removed. */
	rows: TreeRow< Item >[];
	/** The items of `rows`, for handing to DataViews as `data`. */
	data: Item[];
	/** All tree rows on the page, before collapse filtering. */
	treeRows: TreeRow< Item >[];
	paginationInfo: PaginationInfo;
};

/**
 * Build tree rows from flat data.
 *
 * Mirrors the upstream DataViews tree hierarchy (WordPress/gutenberg#77905):
 * parent/child relationships come from ids, rows whose parent is absent from
 * the data (or self-referential) become roots, and rows are re-emitted in
 * depth-first hierarchy order with their depth and direct child count.
 *
 * @param data            - Flat rows.
 * @param getItemId       - Row id resolver.
 * @param getItemParentId - Parent id resolver.
 * @return Tree rows in hierarchy order.
 */
export function getTreeRows< Item >(
	data: Item[],
	getItemId: ( item: Item ) => string,
	getItemParentId: ( item: Item ) => string | number | null | undefined
): TreeRow< Item >[] {
	const treeRows: TreeRow< Item >[] = data.map( ( item, index ) => {
		const parentId = getItemParentId( item );

		return {
			item,
			id: getItemId( item ) || index.toString(),
			depth: 0,
			parentId: parentId === null || parentId === undefined ? undefined : parentId.toString(),
			childCount: 0,
		};
	} );
	const rowById = new Map( treeRows.map( row => [ row.id, row ] ) );
	const roots: TreeRow< Item >[] = [];
	const childrenByParentId = new Map< string, TreeRow< Item >[] >();

	for ( const row of treeRows ) {
		const parent =
			row.parentId && row.parentId !== row.id ? rowById.get( row.parentId ) : undefined;

		if ( ! parent ) {
			row.parentId = undefined;
			roots.push( row );
			continue;
		}

		parent.childCount += 1;
		const children = childrenByParentId.get( parent.id ) ?? [];
		children.push( row );
		childrenByParentId.set( parent.id, children );
	}

	const orderedTreeRows: TreeRow< Item >[] = [];
	const orderedIds = new Set< string >();
	const appendRows = ( rows: TreeRow< Item >[], depth: number ) => {
		for ( const row of rows ) {
			if ( orderedIds.has( row.id ) ) {
				continue;
			}

			orderedIds.add( row.id );
			row.depth = depth;
			orderedTreeRows.push( row );
			appendRows( childrenByParentId.get( row.id ) ?? [], depth + 1 );
		}
	};

	appendRows( roots, 0 );

	return orderedTreeRows;
}

/**
 * Filter tree rows down to the ones whose ancestors are all expanded.
 *
 * Walks the hierarchy-ordered rows with a stack of collapsed depths, hiding
 * every row nested under a collapsed parent (upstream `getVisibleTreeRows`).
 *
 * @param treeRows        - Tree rows in hierarchy order.
 * @param expandedItemIds - Ids of expanded parent rows.
 * @return The visible tree rows.
 */
export function getVisibleTreeRows< Item >(
	treeRows: TreeRow< Item >[],
	expandedItemIds: ReadonlySet< string >
): TreeRow< Item >[] {
	const collapsedDepths: number[] = [];

	return treeRows.filter( row => {
		while ( collapsedDepths.length && row.depth <= collapsedDepths[ collapsedDepths.length - 1 ] ) {
			collapsedDepths.pop();
		}

		const isHidden = collapsedDepths.length > 0;

		if ( row.childCount > 0 && ! expandedItemIds.has( row.id ) ) {
			collapsedDepths.push( row.depth );
		}

		return ! isHidden;
	} );
}

/**
 * Apply DataViews processing to tree rows.
 *
 * Matches the upstream DataViews tree-hierarchy behaviour: search, filters,
 * sorting, and pagination are DataViews' own flat `filterSortAndPaginate`
 * semantics — child rows count as items, and a matching child whose parent is
 * filtered out renders as a root instead of force-expanding the parent. The
 * resulting page slice is then re-ordered into hierarchy order, and rows under
 * collapsed parents are hidden (they still count toward pagination).
 *
 * @param data        - Parent and child rows.
 * @param view        - DataViews view.
 * @param expandedIds - Expanded parent ids.
 * @param options     - Accessors and fields.
 * @return Processed rows and pagination info.
 */
export function processTreeRows< Item >(
	data: Item[],
	view: View,
	expandedIds: ReadonlySet< string >,
	options: ProcessTreeRowsOptions< Item >
): ProcessedTreeRows< Item > {
	const { fields, getItemId, getItemParentId } = options;
	const { data: pageItems, paginationInfo } = filterSortAndPaginate( data, view, fields );
	const treeRows = getTreeRows( pageItems, getItemId, getItemParentId );
	const rows = getVisibleTreeRows( treeRows, expandedIds );

	return {
		rows,
		data: rows.map( row => row.item ),
		treeRows,
		paginationInfo,
	};
}
