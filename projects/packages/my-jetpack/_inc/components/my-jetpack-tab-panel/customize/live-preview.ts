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

		const anchor = child.querySelector< HTMLAnchorElement >( 'a' );
		items.set( id, {
			element: child,
			classAttribute: child.getAttribute( 'class' ),
			hiddenAttribute: child.getAttribute( 'hidden' ),
			styleAttribute: child.getAttribute( 'style' ),
			anchor,
			anchorHtml: anchor?.innerHTML ?? '',
			plainLabelHtml: getPlainLabelHtml( anchor ),
		} );
	} );

	return {
		children: Array.from( submenu.childNodes ),
		items,
	};
};

const restoreBaseline = ( submenu: HTMLElement, baseline: PreviewBaseline ) => {
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

const resetSeparatorMarkup = ( baseline: PreviewBaseline ) => {
	baseline.items.forEach( snapshot => {
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

const isVisibleProduct = ( node: MenuNode, baseline: PreviewBaseline ): node is MenuItemNode =>
	node.type === 'item' &&
	! node.external &&
	node.id !== 'my-jetpack' &&
	node.id !== 'settings' &&
	! node.hidden &&
	baseline.items.has( node.id );

/**
 * Create a reversible adapter for the existing WordPress Jetpack submenu.
 *
 * @param root Document or element containing the WordPress admin menu.
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
			resetSeparatorMarkup( baseline );

			const orderedItems = sequence
				.filter( ( node ): node is MenuItemNode => node.type === 'item' )
				.map( node => ( { node, snapshot: baseline.items.get( node.id ) } ) )
				.filter(
					( entry ): entry is { node: MenuItemNode; snapshot: ItemSnapshot } =>
						entry.snapshot !== undefined
				);

			const firstRenderedItem = Array.from( submenu.children ).find( child =>
				Array.from( baseline.items.values() ).some( snapshot => snapshot.element === child )
			);
			if ( firstRenderedItem ) {
				const marker = document.createComment( 'jetpack-menu-preview' );
				submenu.insertBefore( marker, firstRenderedItem );
				orderedItems.forEach( ( { snapshot } ) => submenu.insertBefore( snapshot.element, marker ) );
				marker.remove();
			}

			orderedItems.forEach( ( { node, snapshot } ) => {
				snapshot.element.hidden = node.hidden;
			} );

			if ( ! sequence.some( node => isVisibleProduct( node, baseline ) ) ) {
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
							candidate.type === 'item' &&
							! candidate.hidden &&
							baseline.items.has( candidate.id )
					) as MenuItemNode | undefined;
				if ( followingItem ) {
					decorateItem( baseline.items.get( followingItem.id ) as ItemSnapshot, node.title );
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
