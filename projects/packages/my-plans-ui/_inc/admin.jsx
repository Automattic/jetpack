/**
 * External dependencies
 */
import ReactDOM from 'react-dom';
import React from 'react';
import { registerStore } from '@wordpress/data';
import { Provider } from 'react-redux';
import { HashRouter, Route, Switch } from 'react-router-dom';

/**
 * Internal dependencies
 */
import Admin from './components/admin'; // TODO
import Main from './main';
import { STORE_ID, storeConfig } from './store';

registerStore( STORE_ID, storeConfig );

/**
 * The initial renderer function.
 */
function render() {
	const container = document.getElementById( 'jetpack-my-plans-ui-container' );

	if ( null === container ) {
		return;
	}

	ReactDOM.render(
		<Provider store={ store }>
			<HashRouter>
				<Switch>
					<Route path="/my-plan">
						<Main routeName={ getRouteName( '/my-plan' ) } />
					</Route>
					<Route path="/plans">
						<Main routeName={ getRouteName( '/plans' ) } />
					</Route>
					<Route path="/plans-prompt">
						<Main routeName={ getRouteName( '/plans-prompt' ) } />
					</Route>
					<Route path="/*">
						<Main routeName={ getRouteName( '/*' ) } />
					</Route>
				</Switch>
			</HashRouter>
		</Provider>,
		container
	);
}

render();

/**
 * Get translated route name according to route path
 *
 * @param {string} path - route path
 * @returns {string} translated route name
 */
export function getRouteName( path ) {
	switch ( path ) {
		case '/my-plan':
			return _x( 'My Plan', 'Navigation item.', 'jetpack' );
		case '/plans':
			return _x( 'Plans', 'Navigation item.', 'jetpack' );
		case '/plans-prompt':
			return _x( 'Plans', 'Navigation item.', 'jetpack' );
		default:
			return _x( 'Unknown', 'Navigation item.', 'jetpack' );
	}
}
