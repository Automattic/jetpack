/**
 * External dependencies
 */
import type { Field, View } from '@wordpress/dataviews';

type ParentUnit< Item > = {
	parent: Item;
	children: Item[];
};

type PaginationInfo = {
	totalItems: number;
	totalPages: number;
};

type ProcessTreeRowsOptions< Item > = {
	getItemId: ( item: Item ) => string;
	getItemParentId: ( item: Item ) => string | undefined;
	fields: Field< Item >[];
};

/**
 * Read a field value from an item, falling back to the item property that
 * matches the field id when the DataViews field does not define getValue.
 *
 * @param item  - The row item.
 * @param field - The DataViews field config.
 * @return The raw field value.
 */
function getFieldValue< Item >( item: Item, field: Field< Item > ): unknown {
	if ( field.getValue ) {
		return field.getValue( { item } );
	}

	return ( item as Record< string, unknown > )[ field.id ];
}

/**
 * Convert a raw field value to its searchable string representation.
 *
 * @param value - The raw field value.
 * @return The normalized string value.
 */
function stringifySearchValue( value: unknown ): string {
	if ( value === null || value === undefined ) {
		return '';
	}

	return String( value ).toLocaleLowerCase();
}

/**
 * Resolve the fields used by global search.
 *
 * @param fields - The DataViews field configs.
 * @return The searchable fields, or the first field as a fallback.
 */
function getSearchFields< Item >( fields: Field< Item >[] ): Field< Item >[] {
	const searchFields = fields.filter( field => field.enableGlobalSearch );

	if ( searchFields.length ) {
		return searchFields;
	}

	return fields[ 0 ] ? [ fields[ 0 ] ] : [];
}

/**
 * Check whether an item matches the global search query.
 *
 * @param item         - The row item.
 * @param search       - The normalized search string.
 * @param searchFields - The fields to inspect.
 * @return Whether the item matches the search.
 */
function itemMatchesSearch< Item >(
	item: Item,
	search: string,
	searchFields: Field< Item >[]
): boolean {
	return searchFields.some( field =>
		stringifySearchValue( getFieldValue( item, field ) ).includes( search )
	);
}

/**
 * Compare two primitive field values for sorting.
 *
 * @param valueA - The first field value.
 * @param valueB - The second field value.
 * @return The ascending comparison result.
 */
function compareFieldValues( valueA: unknown, valueB: unknown ): number {
	if ( typeof valueA === 'number' && typeof valueB === 'number' ) {
		return valueA - valueB;
	}

	return String( valueA ?? '' ).localeCompare( String( valueB ?? '' ) );
}

/**
 * Build an item comparator from the DataViews sort state.
 *
 * @param view      - The current DataViews view.
 * @param fields    - The DataViews field configs.
 * @param getItemId - Resolves stable row ids.
 * @return The item comparator.
 */
function getItemComparator< Item >(
	view: View,
	fields: Field< Item >[],
	getItemId: ( item: Item ) => string
): ( itemA: Item, itemB: Item ) => number {
	const sortFieldId = view.sort?.field;
	const sortField = fields.find( field => field.id === sortFieldId ) ?? fields[ 0 ];
	const direction = view.sort?.direction === 'desc' ? -1 : 1;

	return ( itemA, itemB ) => {
		if ( sortField ) {
			const result =
				direction *
				compareFieldValues( getFieldValue( itemA, sortField ), getFieldValue( itemB, sortField ) );

			if ( result ) {
				return result;
			}
		}

		return getItemId( itemA ).localeCompare( getItemId( itemB ) );
	};
}

/**
 * Group flat tree rows into parent units.
 *
 * @param data            - Parent and child rows.
 * @param getItemId       - Resolves stable row ids.
 * @param getItemParentId - Resolves parent ids for child rows.
 * @return The parent units.
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

		if ( parentId !== undefined ) {
			const children = childrenByParent.get( parentId );

			if ( children ) {
				children.push( item );
			} else {
				childrenByParent.set( parentId, [ item ] );
			}
		} else {
			parents.push( item );
		}
	}

	return parents.map( parent => ( {
		parent,
		children: childrenByParent.get( getItemId( parent ) ) ?? [],
	} ) );
}

/**
 * Apply search, sort, expansion, and parent-unit pagination to flat tree rows.
 *
 * DataViews does not render tree rows itself, so this processor returns the
 * exact flat page slice to render while keeping child rows attached to their
 * parent unit.
 *
 * @param data        - Parent and child rows.
 * @param view        - The current DataViews view.
 * @param expandedIds - Expanded parent row ids.
 * @param options     - Tree accessors and DataViews field config.
 * @return Processed rows and parent-unit pagination info.
 */
export function processTreeRows< Item >(
	data: Item[],
	view: View,
	expandedIds: ReadonlySet< string >,
	options: ProcessTreeRowsOptions< Item >
): { data: Item[]; paginationInfo: PaginationInfo } {
	const { fields, getItemId, getItemParentId } = options;
	const compareItems = getItemComparator( view, fields, getItemId );
	const search = String( view.search ?? '' )
		.trim()
		.toLocaleLowerCase();
	const searchFields = getSearchFields( fields );
	const searchActive = Boolean( search );
	const units: ParentUnit< Item >[] = [];

	for ( const unit of getParentUnits( data, getItemId, getItemParentId ) ) {
		const parentId = getItemId( unit.parent );
		const children = [ ...unit.children ].sort( compareItems );

		if ( ! searchActive ) {
			units.push( {
				parent: unit.parent,
				children: expandedIds.has( parentId ) ? children : [],
			} );
			continue;
		}

		const parentMatches = itemMatchesSearch( unit.parent, search, searchFields );
		const matchingChildren = children.filter( child =>
			itemMatchesSearch( child, search, searchFields )
		);

		if ( ! parentMatches && ! matchingChildren.length ) {
			continue;
		}

		let visibleChildren: Item[] = [];

		if ( parentMatches && expandedIds.has( parentId ) ) {
			visibleChildren = children;
		} else if ( ! parentMatches ) {
			visibleChildren = matchingChildren;
		}

		units.push( {
			parent: unit.parent,
			children: visibleChildren,
		} );
	}

	units.sort( ( unitA, unitB ) => compareItems( unitA.parent, unitB.parent ) );

	const totalItems = units.length;
	const perPage = Math.max( 1, Number( view.perPage ) || 10 );
	const totalPages = Math.ceil( totalItems / perPage );
	const page = Math.max( 1, Number( view.page ) || 1 );
	const start = ( page - 1 ) * perPage;
	const pageUnits = units.slice( start, start + perPage );

	return {
		data: pageUnits.flatMap( unit => [ unit.parent, ...unit.children ] ),
		paginationInfo: {
			totalItems,
			totalPages,
		},
	};
}
