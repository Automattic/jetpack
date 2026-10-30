const SPA_PAGE_SLUG = 'jetpack-spa-wp-admin';

/**
 * Whether a router path belongs to a sidebar entry's route.
 *
 * @param current - The current `p` value.
 * @param route   - The entry's route path.
 * @return Whether the entry owns the path.
 */
export function ownsPath( current: string, route: string ): boolean {
	return (
		current === route || current.startsWith( `${ route }/` ) || current.startsWith( `${ route }?` )
	);
}

/**
 * Make the Jetpack sidebar entries that point at the SPA page navigate the router, and keep the open menu and highlight in step.
 *
 * Outside the router's React tree there is no router to call, so this pushes history and fires `popstate`, which the router listens for.
 */
export function syncSidebarWithRouter(): void {
	if ( new URL( window.location.href ).searchParams.get( 'page' ) !== SPA_PAGE_SLUG ) {
		return;
	}

	const menu = document.getElementById( 'adminmenu' );
	if ( ! menu ) {
		return;
	}

	const linkSelector = `a[href*="page=${ SPA_PAGE_SLUG }"]`;
	const links = [
		...menu.querySelectorAll< HTMLAnchorElement >( `.wp-submenu ${ linkSelector }` ),
	];
	const routeOf = ( link: HTMLAnchorElement ) => new URL( link.href ).searchParams.get( 'p' ) || '';

	const markActive = () => {
		const current = new URL( window.location.href ).searchParams.get( 'p' ) || '/';
		const match = links
			.filter( link => ownsPath( current, routeOf( link ) ) )
			.sort( ( a, b ) => routeOf( b ).length - routeOf( a ).length )[ 0 ];

		const top = document.getElementById( 'toplevel_page_jetpack' );
		if ( top ) {
			menu.querySelectorAll( 'li.wp-has-current-submenu' ).forEach( li => {
				li.classList.replace( 'wp-has-current-submenu', 'wp-not-current-submenu' );
				li.classList.remove( 'wp-menu-open' );
			} );
			top.classList.remove( 'wp-not-current-submenu' );
			top.classList.add( 'wp-has-current-submenu', 'wp-menu-open' );
			top.querySelector( ':scope > a' )?.classList.add( 'wp-has-current-submenu', 'wp-menu-open' );
		}

		menu
			.querySelectorAll( '.wp-submenu .current' )
			.forEach( el => el.classList.remove( 'current' ) );
		match?.classList.add( 'current' );
		match?.parentElement?.classList.add( 'current' );
	};

	menu.addEventListener( 'click', event => {
		const link = ( event.target as Element ).closest< HTMLAnchorElement >( linkSelector );
		if ( ! link || event.metaKey || event.ctrlKey || event.shiftKey || event.button ) {
			return;
		}
		event.preventDefault();
		const state = window.history.state || {};
		window.history.pushState(
			{ ...state, key: String( Date.now() ), __TSR_index: ( state.__TSR_index ?? 0 ) + 1 },
			'',
			link.href
		);
		window.dispatchEvent( new PopStateEvent( 'popstate' ) );
	} );
	window.addEventListener( 'popstate', markActive );
	markActive();
}
