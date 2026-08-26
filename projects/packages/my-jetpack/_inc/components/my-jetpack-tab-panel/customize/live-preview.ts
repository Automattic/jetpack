import type { MenuItemNode, MenuNode } from './types';

const ITEM_CLASS_PREFIX = 'jetpack-admin-menu-item-id-';
const SEPARATOR_CLASS = 'jetpack-admin-menu-separator-start';
const SEPARATOR_LABEL_CLASS = 'jetpack-admin-menu-separator-label';
const ITEM_LABEL_CLASS = 'jetpack-admin-menu-item-label';

type ItemSnapshot = {
	element: HTMLElement;
	classAttribute: string | null;
	hiddenAttribute: string | null;
	styleAttribute: string | null;
	anchor: HTMLAnchorElement | null;
	anchorHtml: string;
	plainLabelHtml: string;
};

type PreviewBaseline = {
	children: ChildNode[];
	items: Map< string, ItemSnapshot >;
};

export type JetpackMenuPreview = {
	apply: ( sequence: MenuNode[] ) => void;
	commit: () => void;
	restore: () => void;
};

const restoreAttribute = ( element: HTMLElement, name: string, value: string | null ) => {
	if ( value === null ) {
		element.removeAttribute( name );
		return;
	}

	element.setAttribute( name, value );
};

const getItemId = ( element: HTMLElement ) => {
	const itemClass = Array.from( element.classList ).find( className =>
		className.startsWith( ITEM_CLASS_PREFIX )
	);

	return itemClass?.slice( ITEM_CLASS_PREFIX.length ) ?? '';
};

const getPlainLabelHtml = ( anchor: HTMLAnchorElement | null ) => {
	if ( ! anchor ) {
		return '';
	}

	const itemLabel = Array.from( anchor.children ).find( child =>
		child.classList.contains( ITEM_LABEL_CLASS )
	);

	return itemLabel?.innerHTML ?? anchor.innerHTML;
};

const snapshotItem = ( element: HTMLElement ): ItemSnapshot => {
	const anchor = element.querySelector< HTMLAnchorElement >( 'a' );

	return {
		element,
		classAttribute: element.getAttribute( 'class' ),
		hiddenAttribute: element.getAttribute( 'hidden' ),
		styleAttribute: element.getAttribute( 'style' ),
		anchor,
		anchorHtml: anchor?.innerHTML ?? '',
		plainLabelHtml: getPlainLabelHtml( anchor ),
	};
};

const captureBaseline = ( submenu: HTMLElement ): PreviewBaseline => {
	const items = new Map< string, ItemSnapshot >();

	Array.from( submenu.children ).forEach( child => {
		if ( ! ( child instanceof HTMLElement ) ) {
			return;
		}

		const id = getItemId( child );
		if ( ! id ) {
			return;
		}

		items.set( id, snapshotItem( child ) );
	} );

	return {
		children: Array.from( submenu.childNodes ),
		items,
	};
};

const restoreBaseline = ( submenu: HTMLElement, baseline: PreviewBaseline ) => {
	submenu
		.querySelectorAll< HTMLElement >( '[data-jetpack-menu-preview-transient]' )
		.forEach( element => element.remove() );
	baseline.children.forEach( child => submenu.appendChild( child ) );
	baseline.items.forEach( snapshot => {
		restoreAttribute( snapshot.element, 'class', snapshot.classAttribute );
		restoreAttribute( snapshot.element, 'hidden', snapshot.hiddenAttribute );
		restoreAttribute( snapshot.element, 'style', snapshot.styleAttribute );
		if ( snapshot.anchor ) {
			snapshot.anchor.innerHTML = snapshot.anchorHtml;
		}
	} );
};

const resetSeparatorMarkup = ( items: Map< string, ItemSnapshot > ) => {
	items.forEach( snapshot => {
		snapshot.element.classList.remove( SEPARATOR_CLASS );
		if ( snapshot.anchor ) {
			snapshot.anchor.innerHTML = snapshot.plainLabelHtml;
		}
	} );
};

const decorateItem = ( snapshot: ItemSnapshot, title: string ) => {
	snapshot.element.classList.add( SEPARATOR_CLASS );
	if ( title === '' || ! snapshot.anchor ) {
		return;
	}

	let itemLabel = Array.from( snapshot.anchor.children ).find( child =>
		child.classList.contains( ITEM_LABEL_CLASS )
	) as HTMLElement | undefined;

	if ( ! itemLabel ) {
		itemLabel = document.createElement( 'span' );
		itemLabel.className = ITEM_LABEL_CLASS;
		while ( snapshot.anchor.firstChild ) {
			itemLabel.appendChild( snapshot.anchor.firstChild );
		}
		snapshot.anchor.appendChild( itemLabel );
	}

	const label = document.createElement( 'span' );
	label.className = SEPARATOR_LABEL_CLASS;
	label.setAttribute( 'aria-hidden', 'true' );
	label.textContent = title;
	snapshot.anchor.insertBefore( label, itemLabel );
};

const isVisibleProduct = (
	node: MenuNode,
	items: Map< string, ItemSnapshot >
): node is MenuItemNode =>
	node.type === 'item' &&
	! node.external &&
	node.id !== 'my-jetpack' &&
	node.id !== 'settings' &&
	! node.hidden &&
	items.has( node.id );

const createTransientItem = ( submenu: HTMLElement, node: MenuItemNode ) => {
	const item = submenu.ownerDocument.createElement( 'li' );
	const safeId = node.id.replace( /[^a-zA-Z0-9_-]/g, '-' );
	item.className = `jetpack-admin-menu-item ${ ITEM_CLASS_PREFIX }${ safeId }`;
	item.dataset.jetpackMenuPreviewTransient = 'true';

	const anchor = submenu.ownerDocument.createElement( 'a' );
	anchor.href = /^(?:https?:\/\/|[a-z0-9_-]+\.php)/i.test( node.menuSlug )
		? node.menuSlug
		: `admin.php?page=${ node.menuSlug }`;
	anchor.textContent = node.label;
	item.appendChild( anchor );
	submenu.appendChild( item );

	return snapshotItem( item );
};

/**
 * Create a reversible adapter for the existing WordPress Jetpack submenu.
 *
 * @param root - Document or element containing the WordPress admin menu.
 * @return Preview lifecycle controls.
 */
export function createJetpackMenuPreview( root: ParentNode = document ): JetpackMenuPreview {
	const submenu = root.querySelector< HTMLElement >( '#toplevel_page_jetpack .wp-submenu' );
	if ( ! submenu ) {
		return {
			apply: () => undefined,
			commit: () => undefined,
			restore: () => undefined,
		};
	}

	let baseline = captureBaseline( submenu );

	return {
		apply( sequence: MenuNode[] ) {
			restoreBaseline( submenu, baseline );
			const workingItems = new Map( baseline.items );
			sequence.forEach( node => {
				if ( node.type === 'item' && ! workingItems.has( node.id ) ) {
					workingItems.set( node.id, createTransientItem( submenu, node ) );
				}
			} );
			resetSeparatorMarkup( workingItems );

			const orderedItems = sequence
				.filter( ( node ): node is MenuItemNode => node.type === 'item' )
				.map( node => ( { node, snapshot: workingItems.get( node.id ) } ) )
				.filter(
					( entry ): entry is { node: MenuItemNode; snapshot: ItemSnapshot } =>
						entry.snapshot !== undefined
				);

			const firstRenderedItem = Array.from( submenu.children ).find( child =>
				Array.from( workingItems.values() ).some( snapshot => snapshot.element === child )
			);
			if ( firstRenderedItem ) {
				const marker = document.createComment( 'jetpack-menu-preview' );
				submenu.insertBefore( marker, firstRenderedItem );
				orderedItems.forEach( ( { snapshot } ) =>
					submenu.insertBefore( snapshot.element, marker )
				);
				marker.remove();
			}

			orderedItems.forEach( ( { node, snapshot } ) => {
				snapshot.element.hidden = node.hidden;
			} );

			if ( ! sequence.some( node => isVisibleProduct( node, workingItems ) ) ) {
				return;
			}

			sequence.forEach( ( node, index ) => {
				if ( node.type !== 'separator' ) {
					return;
				}

				const followingItem = sequence
					.slice( index + 1 )
					.find(
						candidate =>
							candidate.type === 'item' && ! candidate.hidden && workingItems.has( candidate.id )
					) as MenuItemNode | undefined;
				if ( followingItem ) {
					decorateItem( workingItems.get( followingItem.id ) as ItemSnapshot, node.title );
				}
			} );
		},

		commit() {
			baseline = captureBaseline( submenu );
		},

		restore() {
			restoreBaseline( submenu, baseline );
		},
	};
}
