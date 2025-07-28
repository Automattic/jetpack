import jQuery from 'jquery';
import { productDescriptionRoutes } from 'product-descriptions/constants';

const myJetpackRoutes = [ 'my-jetpack ' ];
const dashboardRoutes = [ '/', '/dashboard', '/reconnect', '/my-plan', '/plans' ];
const settingsRoutes = [
	'/settings',
	'/security',
	'/performance',
	'/writing',
	'/sharing',
	'/discussion',
	'/earn',
	'/newsletter',
	'/traffic',
	'/privacy',
];

/**
 * Determines the page order of My Jetpack, Activity Log, Dashboard, and Settings in the left sidebar.
 * @return {object} Object with keys for each page and values for the order of the page in the sidebar.
 */
function jetpackPageOrder() {
	const jetpackParentMenu = document.querySelector( '#toplevel_page_jetpack' );
	const pageOrder = {};

	if ( jetpackParentMenu ) {
		const jetpackSubMenu = jetpackParentMenu.querySelector( '.wp-submenu' );

		if ( jetpackSubMenu ) {
			const subMenuItems = jetpackSubMenu.querySelectorAll( 'li:not(.wp-submenu-head) a' );

			const urlPatterns = [
				{
					key: 'dashboard',
					pattern: '/wp-admin/admin.php?page=jetpack#/dashboard',
					matchType: 'end',
				},
				{
					key: 'activityLog',
					pattern: 'https://jetpack.com/redirect/?source=cloud-activity-log-wp-menu',
					matchType: 'start',
				},
				{
					key: 'settings',
					pattern: '/wp-admin/admin.php?page=jetpack#/settings',
					matchType: 'end',
				},
			];

			const findIndex = ( urlPattern, matchType ) => {
				let foundIndex = -1;
				subMenuItems.forEach( ( item, index ) => {
					const href = item.href;
					if (
						( matchType === 'end' && href.endsWith( urlPattern ) ) ||
						( matchType === 'start' && href.startsWith( urlPattern ) )
					) {
						foundIndex = index + 1;
					}
				} );
				return foundIndex;
			};

			urlPatterns.forEach( ( { key, pattern, matchType } ) => {
				const index = findIndex( pattern, matchType );
				pageOrder[ key ] = index;
			} );
			return pageOrder;
		}
	}
}

/**
 * Manages changing the visuals of the sub-nav items on the left sidebar when the React app changes routes
 *
 */
window.wpNavMenuClassChange = function () {
	const pageOrder = jetpackPageOrder();

	let hash = window.location.hash;
	let page = new URLSearchParams( window.location.search );

	// Clear currently highlighted sub-nav item
	jQuery( '.current' ).each( function ( i, obj ) {
		jQuery( obj ).removeClass( 'current' );
	} );

	const getJetpackSubNavItem = subNavItemIndex => {
		return jQuery( '#toplevel_page_jetpack' )
			.find( 'li' )
			.filter( function ( index ) {
				return index === subNavItemIndex;
			} )[ 0 ];
	};

	// Set the current sub-nav item according to the current hash route
	hash = hash.split( '?' )[ 0 ].replace( /#/, '' );
	page = page.get( 'page' );

	if ( myJetpackRoutes.includes( page ) ) {
		getJetpackSubNavItem( pageOrder.myJetpack )?.classList.add( 'current' );
	} else if ( dashboardRoutes.includes( hash ) || productDescriptionRoutes.includes( hash ) ) {
		getJetpackSubNavItem( pageOrder.dashboard )?.classList.add( 'current' );
	} else if ( settingsRoutes.includes( hash ) ) {
		getJetpackSubNavItem( pageOrder.settings )?.classList.add( 'current' );
	}

	const $body = jQuery( 'body' );

	$body.on(
		'click',
		'a[href$="#/dashboard"], a[href$="#/settings"], .jp-dash-section-header__settings[href="#/security"], .dops-button[href="#/my-plan"], .dops-button[href="#/plans"], .jp-dash-section-header__external-link[href="#/security"]',
		function () {
			window.scrollTo( 0, 0 );
		}
	);

	$body.on( 'click', '.jetpack-js-stop-propagation', function ( e ) {
		e.stopPropagation();
	} );
};
