/**
 * External dependencies
 */
import { filterSortAndPaginate, type Field, type View } from '@wordpress/dataviews';

type ParentUnit< Item > = { parent: Item; children: Item[] };

type PaginationInfo = { totalItems: number; totalPages: number };

type ProcessTreeRowsOptions< Item > = {
	getItemId: ( item: Item ) => string;
	getItemParentId: ( item: Item ) => string | undefined;
	fields: Field< Item >[];
};

/**
 * Build an unpaginated DataViews view.
 *
 * @param view  - DataViews view.
 * @param count - Row count.
 * @return View with every row requested.
 */
function unpaginated( view: View, count: number ): View {
	return {
		...view,
		page: 1,
		perPage: Math.max( count, 1 ),
	};
}

/**
 * Group rows into parent units.
 *
 * @param data            - Rows to group.
 * @param getItemId       - Row id resolver.
 * @param getItemParentId - Parent id resolver.
 * @return Parent units.
 */
function getParentUnits< Item >(
	data: Item[],
	getItemId: ( item: Item ) => string,
	getItemParentId: ( item: Item ) => string | undefined
): ParentUnit< Item >[] {
	const childrenByParent = new Map< string, Item[] >();
	const parents: Item[] = [];

	for ( const item of data ) {
		const parentId = getItemParentId( item );

		if ( parentId === undefined ) {
			parents.push( item );
			continue;
		}

		const children = childrenByParent.get( parentId ) ?? [];
		children.push( item );
		childrenByParent.set( parentId, children );
	}

	return parents.map( parent => ( {
		parent,
		children: childrenByParent.get( getItemId( parent ) ) ?? [],
	} ) );
}

/**
 * Apply DataViews processing to tree rows.
 *
 * DataViews does not render tree rows itself, so this processor returns the
 * exact flat page slice to render while keeping child rows attached to their
 * parent unit. Search, filters, sorting, and pagination are delegated to
 * DataViews' own `filterSortAndPaginate`; only the tree semantics (unit
 * membership, expansion, force-expanding child matches, pagination by parent
 * units) live here.
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
): { data: Item[]; paginationInfo: PaginationInfo } {
	const { fields, getItemId, getItemParentId } = options;
	const units = getParentUnits( data, getItemId, getItemParentId );
	const parents = units.map( unit => unit.parent );
	const matchedParentIds = new Set(
		filterSortAndPaginate( parents, unpaginated( view, parents.length ), fields ).data.map(
			getItemId
		)
	);
	const keptParents: Item[] = [];
	const visibleChildrenByParent = new Map< string, Item[] >();

	for ( const unit of units ) {
		const parentId = getItemId( unit.parent );
		const matchingChildren = filterSortAndPaginate(
			unit.children,
			unpaginated( view, unit.children.length ),
			fields
		).data;
		const parentMatches = matchedParentIds.has( parentId );

		if ( ! parentMatches && ! matchingChildren.length ) {
			continue;
		}

		let visibleChildren = parentMatches ? [] : matchingChildren;

		if ( parentMatches && expandedIds.has( parentId ) ) {
			visibleChildren = filterSortAndPaginate(
				unit.children,
				{
					...unpaginated( view, unit.children.length ),
					search: '',
					filters: [],
				},
				fields
			).data;
		}

		keptParents.push( unit.parent );
		visibleChildrenByParent.set( parentId, visibleChildren );
	}

	const { data: pageParents, paginationInfo } = filterSortAndPaginate(
		keptParents,
		{
			...view,
			search: '',
			filters: [],
		},
		fields
	);

	return {
		data: pageParents.flatMap( parent => [
			parent,
			...( visibleChildrenByParent.get( getItemId( parent ) ) ?? [] ),
		] ),
		paginationInfo,
	};
}
