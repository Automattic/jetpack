import type {
	AdminMenuItem,
	AdminMenuLayout,
	AdminMenuSeparator,
	MenuItemNode,
	MenuNode,
	MenuSeparatorNode,
} from './types';

export const BASE_PRODUCTS_START = 'base-products-start';
export const BASE_PRODUCTS_END = 'base-products-end';

const makeItemNode = ( item: AdminMenuItem, locked = false ): MenuItemNode => ( {
	...item,
	type: 'item',
	locked: locked || ! item.customizable,
} );

const makeBaseSeparator = ( id: string, order: number ): MenuSeparatorNode => ( {
	type: 'separator',
	id,
	title: '',
	order,
	base: true,
	locked: true,
} );

const isProductItem = ( item: AdminMenuItem ) =>
	! item.external && item.id !== 'my-jetpack' && item.id !== 'settings';

const compareProducts = ( a: AdminMenuItem, b: AdminMenuItem ) => {
	if ( a.newlyActivated !== b.newlyActivated ) {
		return a.newlyActivated ? -1 : 1;
	}
	if ( a.hasSavedOrder && b.hasSavedOrder && a.order !== b.order ) {
		return a.order - b.order;
	}
	if ( a.hasSavedOrder !== b.hasSavedOrder ) {
		return a.hasSavedOrder ? -1 : 1;
	}

	return a.label.localeCompare( b.label );
};

const normalizeProductRegionOrders = ( sequence: MenuNode[] ) => {
	let order = 0;

	return sequence.map( node => {
		if (
			( node.type === 'item' && isProductItem( node ) ) ||
			( node.type === 'separator' && ! node.base )
		) {
			const orderedNode = { ...node, order };
			order += 10;
			return orderedNode;
		}

		return node;
	} );
};

/**
 * Build the one-dimensional representation used by both the editor and the sidebar preview.
 *
 * @param items      - Registered menu items.
 * @param separators - Persisted custom separators.
 * @return Anchored menu sequence.
 */
export function buildMenuSequence(
	items: AdminMenuItem[],
	separators: Record< string, AdminMenuSeparator >
): MenuNode[] {
	const myJetpack = items.find( item => item.id === 'my-jetpack' );
	const settings = items.find( item => item.id === 'settings' );
	const products = items.filter( isProductItem ).sort( compareProducts );
	const external = items
		.filter( item => item.external && item.id !== 'my-jetpack' && item.id !== 'settings' )
		.sort( ( a, b ) => {
			const aIsManage = a.id === 'jetpack-manage';
			const bIsManage = b.id === 'jetpack-manage';
			if ( aIsManage !== bIsManage ) {
				return aIsManage ? -1 : 1;
			}

			return items.indexOf( a ) - items.indexOf( b );
		} );
	const sequence: MenuNode[] = [];

	if ( myJetpack ) {
		sequence.push( makeItemNode( myJetpack, true ) );
	}

	if ( products.length > 0 ) {
		const effectiveProducts = products.map( ( item, index ) => ( {
			item,
			order: item.hasSavedOrder ? item.order : index * 10,
		} ) );
		const customSeparators = Object.entries( separators ).map( ( [ id, separator ] ) => ( {
			separator: {
				...separator,
				id: separator.id || id,
			},
			order: separator.order,
		} ) );
		const productRegion = [
			...effectiveProducts.map( entry => ( { ...entry, kind: 'item' as const } ) ),
			...customSeparators.map( entry => ( { ...entry, kind: 'separator' as const } ) ),
		].sort( ( a, b ) => {
			if ( a.order !== b.order ) {
				return a.order - b.order;
			}

			return a.kind === 'item' ? -1 : 1;
		} );

		sequence.push( makeBaseSeparator( BASE_PRODUCTS_START, -10 ) );
		productRegion.forEach( entry => {
			if ( entry.kind === 'item' ) {
				sequence.push( makeItemNode( entry.item ) );
				return;
			}

			sequence.push( {
				...entry.separator,
				type: 'separator',
				base: false,
				locked: false,
			} );
		} );
		sequence.push( makeBaseSeparator( BASE_PRODUCTS_END, Number.MAX_SAFE_INTEGER ) );
	}

	if ( settings ) {
		sequence.push( makeItemNode( settings, true ) );
	}

	external.forEach( item => sequence.push( makeItemNode( item, true ) ) );

	return normalizeProductRegionOrders( sequence );
}

const isEditableNode = ( node: MenuNode ) => ! node.locked;

/**
 * Reorder editable rows while keeping protected rows in their original slots.
 *
 * @param sequence   - Current menu sequence.
 * @param orderedIds - Editable IDs in their requested order.
 * @return Updated sequence.
 */
export function reorderEditableNodes( sequence: MenuNode[], orderedIds: string[] ): MenuNode[] {
	const editableNodes = sequence.filter( isEditableNode );
	const editableById = new Map( editableNodes.map( node => [ node.id, node ] ) );
	const usedIds = new Set< string >();
	const orderedNodes = orderedIds.reduce< MenuNode[] >( ( result, id ) => {
		const node = editableById.get( id );
		if ( node && ! usedIds.has( id ) ) {
			result.push( node );
			usedIds.add( id );
		}
		return result;
	}, [] );

	editableNodes.forEach( node => {
		if ( ! usedIds.has( node.id ) ) {
			orderedNodes.push( node );
		}
	} );

	let editableIndex = 0;
	return normalizeProductRegionOrders(
		sequence.map( node => ( isEditableNode( node ) ? orderedNodes[ editableIndex++ ] : node ) )
	);
}

/**
 * Move an editable row by one editable position.
 *
 * @param sequence  - Current sequence.
 * @param id        - Row ID.
 * @param direction - Negative for up, positive for down.
 * @return Updated sequence, or the original sequence at a protected boundary.
 */
export function moveEditableNode(
	sequence: MenuNode[],
	id: string,
	direction: -1 | 1
): MenuNode[] {
	const editableIds = sequence.filter( isEditableNode ).map( node => node.id );
	const index = editableIds.indexOf( id );
	const nextIndex = index + direction;
	if ( index < 0 || nextIndex < 0 || nextIndex >= editableIds.length ) {
		return sequence;
	}

	const reorderedIds = [ ...editableIds ];
	[ reorderedIds[ index ], reorderedIds[ nextIndex ] ] = [
		reorderedIds[ nextIndex ],
		reorderedIds[ index ],
	];

	return reorderEditableNodes( sequence, reorderedIds );
}

/**
 * Add an untitled custom separator after the first product row.
 *
 * @param sequence - Current sequence.
 * @param id       - Stable separator ID generated by the caller.
 * @return Updated sequence.
 */
export function addCustomSeparator( sequence: MenuNode[], id: string ): MenuNode[] {
	if ( sequence.some( node => node.id === id ) ) {
		return sequence;
	}

	const firstProductIndex = sequence.findIndex(
		node => node.type === 'item' && isProductItem( node )
	);
	if ( firstProductIndex < 0 ) {
		return sequence;
	}

	const nextSequence = [ ...sequence ];
	nextSequence.splice( firstProductIndex + 1, 0, {
		type: 'separator',
		id,
		title: '',
		order: 0,
		base: false,
		locked: false,
	} );

	return normalizeProductRegionOrders( nextSequence );
}

/**
 * Rename a custom separator without changing its position.
 *
 * @param sequence - Current sequence.
 * @param id       - Separator ID.
 * @param title    - New optional title.
 * @return Updated sequence.
 */
export function updateCustomSeparator(
	sequence: MenuNode[],
	id: string,
	title: string
): MenuNode[] {
	return sequence.map( node =>
		node.type === 'separator' && ! node.base && node.id === id ? { ...node, title } : node
	);
}

/**
 * Remove a custom separator.
 *
 * @param sequence - Current sequence.
 * @param id       - Separator ID.
 * @return Updated sequence.
 */
export function removeCustomSeparator( sequence: MenuNode[], id: string ): MenuNode[] {
	const nextSequence = sequence.filter(
		node => ! ( node.type === 'separator' && ! node.base && node.id === id )
	);

	return nextSequence.length === sequence.length
		? sequence
		: normalizeProductRegionOrders( nextSequence );
}

/**
 * Change the visibility of an editable product row.
 *
 * @param sequence - Current sequence.
 * @param id       - Product ID.
 * @param visible  - Whether the product should be visible.
 * @return Updated sequence.
 */
export function updateItemVisibility(
	sequence: MenuNode[],
	id: string,
	visible: boolean
): MenuNode[] {
	return sequence.map( node =>
		node.type === 'item' && ! node.locked && node.id === id ? { ...node, hidden: ! visible } : node
	);
}

/**
 * Convert an editor sequence into a persistence payload.
 *
 * @param sequence       - Current sequence.
 * @param previousLayout - Resolved layout used to retain non-visible product preferences.
 * @return Layout without derived base separators.
 */
export function serializeDraftLayout(
	sequence: MenuNode[],
	previousLayout: AdminMenuLayout = { items: {}, separators: {} }
): AdminMenuLayout {
	const hasProductRegion = sequence.some( node => node.type === 'item' && isProductItem( node ) );

	return sequence.reduce< AdminMenuLayout >(
		( layout, node ) => {
			if ( node.type === 'item' ) {
				layout.items[ node.id ] = {
					hidden: node.hidden,
					order: node.order,
				};
			} else if ( ! node.base ) {
				layout.separators[ node.id ] = {
					id: node.id,
					title: node.title,
					order: node.order,
				};
			}

			return layout;
		},
		{
			items: { ...previousLayout.items },
			separators: hasProductRegion ? {} : { ...previousLayout.separators },
		}
	);
}

/**
 * Alphabetize each contiguous run of products without moving section boundaries.
 *
 * @param sequence - Current menu sequence.
 * @return Sequence with each product run alphabetized.
 */
export function alphabetizeMenuSections( sequence: MenuNode[] ): MenuNode[] {
	const result = [ ...sequence ];
	let runStart = -1;

	const sortRun = ( end: number ) => {
		if ( runStart < 0 ) {
			return;
		}

		const sorted = result
			.slice( runStart, end )
			.sort( ( a, b ) =>
				a.type === 'item' && b.type === 'item' ? a.label.localeCompare( b.label ) : 0
			);
		result.splice( runStart, sorted.length, ...sorted );
		runStart = -1;
	};

	result.forEach( ( node, index ) => {
		if ( node.type === 'item' && isProductItem( node ) && ! node.locked ) {
			if ( runStart < 0 ) {
				runStart = index;
			}
			return;
		}

		sortRun( index );
	} );
	sortRun( result.length );

	return normalizeProductRegionOrders( result );
}

/**
 * Compare two sequences through their normalized persistence payloads.
 *
 * @param baseline - Last persisted sequence.
 * @param draft    - Current editor sequence.
 * @return Whether the draft differs from the baseline.
 */
export function hasDraftChanged( baseline: MenuNode[], draft: MenuNode[] ): boolean {
	return (
		JSON.stringify( serializeDraftLayout( baseline ) ) !==
		JSON.stringify( serializeDraftLayout( draft ) )
	);
}
