/**
 * Bring the wp-admin sidebar up to date with the site without reloading the page.
 *
 * Items already on screen are kept, not replaced, so core's hover handlers, this page's
 * `current` classes and the menu badges survive.
 */

/**
 * Fetch an admin page and return its sidebar menu.
 *
 * @param url    - A cheap admin page; which one does not matter, only its menu is read.
 * @param signal - Aborts the request when a newer one supersedes it.
 * @return The page's `#adminmenu`, or null when the response has none.
 */
export async function fetchAdminMenu(
	url: string,
	signal?: AbortSignal
): Promise< HTMLUListElement | null > {
	const response = await fetch( url, {
		credentials: 'same-origin',
		// Plugins whose activation redirect checks wp_is_json_request() (e.g. Jetpack CRM's
		// wizard) then keep it for the next page the user opens, rather than this fetch.
		headers: { Accept: 'application/json' },
		signal,
	} );

	if ( ! response.ok ) {
		return null;
	}

	const doc = new DOMParser().parseFromString( await response.text(), 'text/html' );

	return doc.querySelector< HTMLUListElement >( '#adminmenu' );
}

/**
 * A menu item's own link, not one inside its submenu.
 *
 * @param item - A top-level or submenu item.
 * @return The link, if the item has one.
 */
export function menuLinkOf( item: Element ): HTMLElement | null {
	return item.querySelector< HTMLElement >( ':scope > a' );
}

/* Args core bakes the current page into: Appearance > Customize carries the page it was
   rendered on, so matching on the raw href makes it new on every refresh. */
const VOLATILE_ARGS = [ 'return', '_wpnonce' ];

/**
 * The key an item is matched on across the two menus.
 *
 * @param item - A top-level item (keyed by id) or a submenu item (keyed by link).
 * @return The key, or an empty string for items with nothing stable to match on.
 */
function keyOf( item: Element ): string {
	if ( item.id ) {
		return `#${ item.id }`;
	}

	const href = menuLinkOf( item )?.getAttribute( 'href' );

	if ( ! href ) {
		return '';
	}

	const link = new URL( href, window.location.href );

	VOLATILE_ARGS.forEach( arg => link.searchParams.delete( arg ) );
	link.searchParams.sort();

	return link.pathname + link.search;
}

/**
 * Make the sidebar on screen match a freshly fetched one, touching only what differs.
 *
 * Recurses into submenus. Separators and submenu headings have no key and are left alone.
 *
 * @param live  - The `#adminmenu` on screen, or one of its submenus.
 * @param fresh - The same list from the fetched page.
 * @return The items that were added, top-level or submenu.
 */
export function syncAdminMenu( live: Element, fresh: Element ): HTMLElement[] {
	const liveItems = new Map< string, HTMLElement >();
	const freshItems = new Map(
		Array.from( fresh.children )
			.map( item => [ keyOf( item ), item ] as const )
			.filter( ( [ key ] ) => key )
	);
	const added: HTMLElement[] = [];

	Array.from( live.children ).forEach( item => {
		const key = keyOf( item );

		// Still closing from an earlier refresh: never matched, so an item switched straight
		// back on comes in fresh rather than as this one, which is about to go.
		if ( ! key || item.hasAttribute( LEAVING ) ) {
			return;
		}

		if ( freshItems.has( key ) ) {
			liveItems.set( key, item as HTMLElement );
		} else {
			slideOut( item as HTMLElement );
		}
	} );

	// New items land after the nearest item both lists share (or before the first, keeping a
	// submenu's heading on top), so nothing already on screen moves.
	let previous: HTMLElement | null = null;
	const firstKept = liveItems.values().next().value;

	freshItems.forEach( ( item, key ) => {
		const existing = liveItems.get( key );

		if ( existing ) {
			const liveSubmenu = existing.querySelector( ':scope > .wp-submenu' );
			const freshSubmenu = item.querySelector( ':scope > .wp-submenu' );

			if ( liveSubmenu && freshSubmenu ) {
				added.push( ...syncAdminMenu( liveSubmenu, freshSubmenu ) );
			} else if ( freshSubmenu ) {
				// A plugin's top-level item gaining its first subpage.
				const submenu = live.ownerDocument.importNode( freshSubmenu, true ) as HTMLElement;

				existing.append( submenu );
				existing.classList.add( 'wp-has-submenu' );
				added.push( ...( Array.from( submenu.children ).filter( keyOf ) as HTMLElement[] ) );
			} else if ( liveSubmenu ) {
				liveSubmenu.remove();
				existing.classList.remove( 'wp-has-submenu' );
			}

			previous = existing;
			return;
		}

		const node = live.ownerDocument.importNode( item, true ) as HTMLElement;

		if ( previous ) {
			previous.after( node );
		} else if ( firstKept ) {
			firstKept.before( node );
		} else {
			live.append( node );
		}

		added.push( node );
		previous = node;
	} );

	return added;
}

/**
 * Whether a menu item links to a URL.
 *
 * Matched on the `page` argument where there is one, since menu links are relative and a
 * feature's URL is absolute.
 *
 * @param item - The menu item.
 * @param url  - The URL to look for.
 * @return True when the item's own link goes there.
 */
export function linksTo( item: Element, url: string ): boolean {
	const href = menuLinkOf( item )?.getAttribute( 'href' );

	if ( ! href || ! url ) {
		return false;
	}

	const target = new URL( url, window.location.href );
	const link = new URL( href, target );
	const page = target.searchParams.get( 'page' );

	return page
		? link.searchParams.get( 'page' ) === page
		: link.pathname === target.pathname && link.search === target.search;
}

const LEAVING = 'data-jp-menu-leaving';

/**
 * Animate a menu item's height between nothing and its own, clipping it meanwhile.
 *
 * @param item    - The menu item.
 * @param opening - True to grow it open, false to close it.
 * @return Settles when the animation ends or is cancelled; null when it cannot run.
 */
function slide( item: HTMLElement, opening: boolean ): Promise< unknown > | null {
	const height = item.offsetHeight;

	// Hidden items (a folded sidebar's submenus) have no height to animate.
	if (
		! height ||
		typeof item.animate !== 'function' ||
		window.matchMedia?.( '(prefers-reduced-motion: reduce)' ).matches
	) {
		return null;
	}

	const open = { height: `${ height }px`, opacity: 1 };
	const closed = { height: '0px', opacity: 0 };

	item.style.overflow = 'hidden';

	return (
		item
			.animate( opening ? [ closed, open ] : [ open, closed ], {
				duration: 300,
				easing: 'cubic-bezier(0.2, 0, 0, 1)',
			} )
			// A cancelled animation rejects; the item is settled either way.
			.finished.catch( () => undefined )
	);
}

/**
 * Grow new menu items open, so they push the items below down rather than appear at once.
 *
 * @param items - Menu items just added.
 */
export function slideIn( items: HTMLElement[] ): void {
	items.forEach( item =>
		slide( item, true )?.then( () => item.style.removeProperty( 'overflow' ) )
	);
}

/**
 * Close a menu item and then remove it, pulling the items below up.
 *
 * @param item - The menu item leaving the menu.
 */
function slideOut( item: HTMLElement ): void {
	item.setAttribute( LEAVING, '' );
	item.style.pointerEvents = 'none';

	const closing = slide( item, false );

	if ( closing ) {
		closing.then( () => item.remove() );
	} else {
		item.remove();
	}
}
