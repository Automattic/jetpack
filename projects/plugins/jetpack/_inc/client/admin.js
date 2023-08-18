import * as WPElement from '@wordpress/element';
import { _x } from '@wordpress/i18n';
import accessibleFocus from 'lib/accessible-focus';
import { assign } from 'lodash';
import Main from 'main';
import React from 'react';
import { Provider } from 'react-redux';
import { HashRouter, Route, Switch } from 'react-router-dom';
import * as actionTypes from 'state/action-types';
import store from 'state/redux-store';

// Initialize the accessibile focus to allow styling specifically for keyboard navigation
accessibleFocus();

// Add dispatch and actionTypes to the window object so we can use it from the browser's console
if ( 'undefined' !== typeof window && process.env.NODE_ENV === 'development' ) {
	assign( window, {
		actionTypes: actionTypes,
		dispatch: store.dispatch,
	} );
}

render();

/**
 *
 */
function render() {
	const container = document.getElementById( 'jp-plugin-container' );

	if ( container === null ) {
		return;
	}

	// @todo: Remove fallback when we drop support for WP 6.1
	const component = (
		<div>
			<Provider store={ store }>
				<HashRouter>
					<Switch>
						<Route path="/dashboard">
							<Main routeName={ getRouteName( '/dashboard' ) } />
						</Route>
						<Route path="/reconnect">
							<Main routeName={ getRouteName( '/reconnect' ) } />
						</Route>
						<Route path="/setup">
							<Main routeName={ getRouteName( '/setup' ) } />
						</Route>
						<Route path="/my-plan">
							<Main routeName={ getRouteName( '/my-plan' ) } />
						</Route>
						<Route path="/plans">
							<Main routeName={ getRouteName( '/plans' ) } />
						</Route>
						<Route path="/recommendations">
							<Main routeName={ getRouteName( '/recommendations' ) } />
						</Route>
						<Route path="/plans-prompt">
							<Main routeName={ getRouteName( '/plans-prompt' ) } />
						</Route>
						<Route path="/settings">
							<Main routeName={ getRouteName( '/settings' ) } />
						</Route>
						<Route path="/discussion">
							<Main routeName={ getRouteName( '/discussion' ) } />
						</Route>
						<Route path="/earn">
							<Main routeName={ getRouteName( '/earn' ) } />
						</Route>
						<Route path="/newsletter">
							<Main routeName={ getRouteName( '/newsletter' ) } />
						</Route>
						<Route path="/security">
							<Main routeName={ getRouteName( '/security' ) } />
						</Route>
						<Route path="/performance">
							<Main routeName={ getRouteName( '/performance' ) } />
						</Route>
						<Route path="/traffic">
							<Main routeName={ getRouteName( '/traffic' ) } />
						</Route>
						<Route path="/writing">
							<Main routeName={ getRouteName( '/writing' ) } />
						</Route>
						<Route path="/sharing">
							<Main routeName={ getRouteName( '/sharing' ) } />
						</Route>
						<Route path="/license/activation">
							<Main routeName={ getRouteName( '/license/activation' ) } />
						</Route>
						<Route path="/wpbody-content" component={ Main } />
						<Route path="/wp-toolbar" component={ Main } />
						<Route path="/privacy" component={ Main } />
						<Route path="/*">
							<Main routeName={ getRouteName( '/*' ) } />
						</Route>
					</Switch>
				</HashRouter>
			</Provider>
		</div>
	);
	if ( WPElement.createRoot ) {
		WPElement.createRoot( container ).render( component );
	} else {
		WPElement.render( component, container );
	}
}

/**
 * Get translated route name according to route path
 *
 * @param {string} path - route path
 * @returns {string} translated route name
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
			return _x( 'Earn', 'Navigation item.', 'jetpack' );
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
