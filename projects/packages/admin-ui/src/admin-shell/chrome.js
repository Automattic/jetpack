/*
 * The wp-admin chrome around the app: sidebar highlight, body class and document title.
 */

export const pageOf = url => new URL( url, location.href ).searchParams.get( 'page' );

const highlightMenu = slug => {
	// Submenu links first: a top-level item can point at the same page as its first submenu item.
	const link = [
		...document.querySelectorAll( '#adminmenu .wp-submenu a[href]' ),
		...document.querySelectorAll( '#adminmenu a[href]' ),
	].find( a => pageOf( a.href ) === slug && ! new URL( a.href, location.href ).hash );
	if ( ! link ) {
		return;
	}
	const top = link.closest( 'li.menu-top' );
	document.querySelectorAll( '#adminmenu li.menu-top' ).forEach( li => {
		const on = li === top;
		const hasSub = li.classList.contains( 'wp-has-submenu' );
		li.classList.toggle( hasSub ? 'wp-has-current-submenu' : 'current', on );
		li.classList.toggle( 'wp-menu-open', on && hasSub );
		li.classList.toggle( 'wp-not-current-submenu', hasSub && ! on );
		li.querySelector( ':scope > a' )?.classList.toggle(
			hasSub ? 'wp-has-current-submenu' : 'current',
			on
		);
	} );
	document.querySelectorAll( '#adminmenu .wp-submenu li' ).forEach( li => {
		const on = li.contains( link );
		const a = li.querySelector( 'a' );
		li.classList.toggle( 'current', on );
		a?.classList.toggle( 'current', on );
		a?.toggleAttribute( 'aria-current', on );
	} );
};

/**
 * Make the chrome match the page on screen.
 *
 * @param {string} slug    - Page on screen.
 * @param {object} members - Member config keyed by slug.
 */
export function updateChrome( slug, members ) {
	// Dashboards scope their layout styles to WordPress's per-page body class.
	for ( const member of Object.keys( members ) ) {
		document.body.classList.toggle( `jetpack_page_${ member }`, member === slug );
	}
	highlightMenu( slug );
	document.title = document.title.replace( /^[^‹]*/, `${ members[ slug ].title } ` );

	// After Back/Forward, focus would keep the previous page's menu link lit.
	// eslint-disable-next-line @wordpress/no-global-active-element -- The shell owns the whole document.
	const focused = document.activeElement;
	if ( focused?.closest?.( '#adminmenu' ) && focused.href && pageOf( focused.href ) !== slug ) {
		focused.blur();
	}
}
