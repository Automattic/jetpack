/**
 * My Jetpack Notification Bubble async loader.
 * Fetches fresh alert data via REST API without blocking page load.
 */
import apiFetch from '@wordpress/api-fetch';

// Minimal type for counting non-silent alerts.
type Alert = {
	is_silent?: boolean;
};

type AlertsResponse = Record< string, Alert >;

apiFetch< AlertsResponse >( {
	path: 'my-jetpack/v1/red-bubble-notifications',
	method: 'POST',
} )
	.then( alerts => {
		const count = Object.values( alerts ).filter( a => ! a.is_silent ).length;
		const menuItem = document.querySelector( '#toplevel_page_jetpack .wp-menu-name' );

		if ( ! menuItem ) {
			return;
		}

		const bubble = menuItem.querySelector( '.awaiting-mod' );

		if ( count > 0 ) {
			if ( bubble ) {
				bubble.className = 'awaiting-mod';
				bubble.textContent = String( count );
			} else {
				const span = document.createElement( 'span' );
				span.className = 'awaiting-mod';
				span.textContent = String( count );
				menuItem.appendChild( document.createTextNode( ' ' ) );
				menuItem.appendChild( span );
			}
		} else if ( bubble ) {
			bubble.remove();
		}
	} )
	.catch( () => {
		// Silent failure - red bubble notification is non-critical.
		// Cache will be populated on next My Jetpack page visit.
	} );
