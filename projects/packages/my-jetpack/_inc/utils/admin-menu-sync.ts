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

	return menuLinkOf( item )?.getAttribute( 'href' ) ?? '';
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

		if ( ! key ) {
			return;
		}

		if ( freshItems.has( key ) ) {
			liveItems.set( key, item as HTMLElement );
		} else {
			item.remove();
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
