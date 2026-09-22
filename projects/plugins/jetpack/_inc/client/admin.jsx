import * as WPElement from '@wordpress/element';
import { _x } from '@wordpress/i18n';
import { Provider } from 'react-redux';
import { HashRouter, Route, Routes } from 'react-router';
import accessibleFocus from 'lib/accessible-focus';
import Main from 'main';
import * as actionTypes from 'state/action-types';
import store from 'state/redux-store';

// Initialize the accessibile focus to allow styling specifically for keyboard navigation
accessibleFocus();

// Add dispatch and actionTypes to the window object so we can use it from the browser's console
// eslint-disable-next-line no-undef -- webpack sets process.env.NODE_ENV
if ( 'undefined' !== typeof window && process.env.NODE_ENV === 'development' ) {
	Object.assign( window, {
		actionTypes: actionTypes,
		dispatch: store.dispatch,
	} );
}

render();

/**
 * Initial render function.
 */
function render() {
	const container = document.getElementById( 'jp-plugin-container' );

	if ( container === null ) {
		return;
	}

	const component = (
		<div>
			<Provider store={ store }>
				<HashRouter>
					<Routes>
						<Route path="/*" element={ <Main /> } />
					</Routes>
				</HashRouter>
			</Provider>
		</div>
	);
	WPElement.createRoot( container ).render( component );
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
