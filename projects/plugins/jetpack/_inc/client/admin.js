import * as WPElement from '@wordpress/element';
import { _x } from '@wordpress/i18n';
import { assign } from 'lodash';
import { Provider } from 'react-redux';
import { HashRouter, Route, Routes } from 'react-router-dom';
import accessibleFocus from 'lib/accessible-focus';
import Main from 'main';
import * as actionTypes from 'state/action-types';
import store from 'state/redux-store';

// Initialize the accessibile focus to allow styling specifically for keyboard navigation
accessibleFocus();

// Add dispatch and actionTypes to the window object so we can use it from the browser's console
// eslint-disable-next-line no-undef -- webpack sets process.env.NODE_ENV
if ( 'undefined' !== typeof window && process.env.NODE_ENV === 'development' ) {
	assign( window, {
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
						<Route
							path="/dashboard"
							element={ <Main routeName={ getRouteName( '/dashboard' ) } /> }
						/>
						<Route
							path="/reconnect"
							element={ <Main routeName={ getRouteName( '/reconnect' ) } /> }
						/>
						<Route path="/setup" element={ <Main routeName={ getRouteName( '/setup' ) } /> } />
						<Route path="/my-plan" element={ <Main routeName={ getRouteName( '/my-plan' ) } /> } />
						<Route path="/plans" element={ <Main routeName={ getRouteName( '/plans' ) } /> } />
						<Route
							path="/recommendations/*"
							element={ <Main routeName={ getRouteName( '/recommendations' ) } /> }
						/>
						<Route
							path="/plans-prompt"
							element={ <Main routeName={ getRouteName( '/plans-prompt' ) } /> }
						/>
						<Route
							path="/settings"
							element={ <Main routeName={ getRouteName( '/settings' ) } /> }
						/>
						<Route
							path="/discussion"
							element={ <Main routeName={ getRouteName( '/discussion' ) } /> }
						/>
						<Route path="/earn" element={ <Main routeName={ getRouteName( '/earn' ) } /> } />
						<Route
							path="/newsletter"
							element={ <Main routeName={ getRouteName( '/newsletter' ) } /> }
						/>
						<Route
							path="/security"
							element={ <Main routeName={ getRouteName( '/security' ) } /> }
						/>
						<Route
							path="/performance"
							element={ <Main routeName={ getRouteName( '/performance' ) } /> }
						/>
						<Route path="/traffic" element={ <Main routeName={ getRouteName( '/traffic' ) } /> } />
						<Route path="/writing" element={ <Main routeName={ getRouteName( '/writing' ) } /> } />
						<Route path="/sharing" element={ <Main routeName={ getRouteName( '/sharing' ) } /> } />
						<Route
							path="/license/activation"
							element={ <Main routeName={ getRouteName( '/license/activation' ) } /> }
						/>
						<Route path="/wpbody-content" element={ <Main /> } />
						<Route path="/wp-toolbar" element={ <Main /> } />
						<Route path="/privacy" element={ <Main /> } />
						<Route path="/*" element={ <Main routeName={ getRouteName( '/*' ) } /> } />
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
		case '/dashboard':
			return _x( 'At A Glance', 'Navigation item.', 'jetpack' );
		case '/setup':
			return _x( 'Set up', 'Navigation item.', 'jetpack' );
		case '/my-plan':
			return _x( 'My Plan', 'Navigation item.', 'jetpack' );
		case '/plans':
			return _x( 'Plans', 'Navigation item.', 'jetpack' );
		case '/recommendations':
			return _x( 'Recommendations', 'Navigation item.', 'jetpack' );
		case '/plans-prompt':
			return _x( 'Plans', 'Navigation item.', 'jetpack' );
		case '/settings':
			return _x( 'Settings', 'Navigation item.', 'jetpack' );
		case '/discussion':
			return _x( 'Discussion', 'Navigation item.', 'jetpack' );
		case '/earn':
			return _x( 'Monetize', 'Navigation item.', 'jetpack' );
		case '/newsletter':
			return _x( 'Newsletter', 'Navigation item.', 'jetpack' );
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
		case '/license/activation':
			return _x( 'License', 'Navigation item.', 'jetpack' );
		default:
			return _x( 'At A Glance', 'Navigation item.', 'jetpack' );
	}
}
