import * as WPElement from '@wordpress/element';
import { _x } from '@wordpress/i18n';
import SettingsRoot from 'settings-root';

render();

/**
 * Initial render function.
 */
function render() {
	const container = document.getElementById( 'jp-plugin-container' );

	if ( container === null ) {
		return;
	}

	WPElement.createRoot( container ).render( <SettingsRoot /> );
}

/**
 * Get translated route name according to route path
 *
 * @param {string} path - route path
 * @return {string} translated route name
 */
export function getRouteName( path ) {
	switch ( path ) {
		case '/discussion':
			return _x( 'Discussion', 'Navigation item.', 'jetpack' );
		case '/earn':
			return _x( 'Monetize', 'Navigation item.', 'jetpack' );
		case '/newsletter':
			return _x( 'Newsletter', 'Navigation item.', 'jetpack' );
		case '/reader':
			return _x( 'Reader', 'Navigation item.', 'jetpack' );
		case '/security':
			return _x( 'Security', 'Navigation item.', 'jetpack' );
		case '/performance':
			return _x( 'Performance', 'Navigation item.', 'jetpack' );
		case '/traffic':
			return _x( 'Traffic', 'Navigation item.', 'jetpack' );
		case '/writing':
			return _x( 'Writing', 'Navigation item.', 'jetpack' );
		case '/sharing':
			return _x( 'Sharing', 'Navigation item.', 'jetpack' );
		default:
			return _x( 'Settings', 'Navigation item.', 'jetpack' );
	}
}
