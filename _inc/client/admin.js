/**
 * External dependencies
 */
import ReactDOM from 'react-dom';
import React from 'react';
import { Provider } from 'react-redux';
import { HashRouter, Route, Switch } from 'react-router-dom';
import { assign, get } from 'lodash';

/**
 * Internal dependencies
 */
import accessibleFocus from 'lib/accessible-focus';
import store from 'state/redux-store';
import i18n from 'i18n-calypso';
import Main from 'main';
import * as actionTypes from 'state/action-types';

// Initialize the accessibile focus to allow styling specifically for keyboard navigation
accessibleFocus();

const Initial_State = window.Initial_State;

Initial_State.locale = JSON.parse( Initial_State.locale );
Initial_State.locale = get( Initial_State.locale, [ 'locale_data', 'jetpack' ], {} );

if ( 'undefined' !== typeof Initial_State.locale[ '' ] ) {
	Initial_State.locale[ '' ].localeSlug = Initial_State.localeSlug;

	// Overloading the toLocaleString method to use the set locale
	Number.prototype.realToLocaleString = Number.prototype.toLocaleString;

	Number.prototype.toLocaleString = function( locale, options ) {
		locale = locale || Initial_State.localeSlug;
		options = options || {};

		return this.realToLocaleString( locale, options );
	};
} else {
	Initial_State.locale = { '': { localeSlug: Initial_State.localeSlug } };
}

i18n.setLocale( Initial_State.locale );

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

	ReactDOM.render(
		<div>
			<Provider store={ store }>
				<HashRouter>
					<Switch>
						<Route path="/dashboard">
							<Main
								routeName={ i18n.translate( 'At A Glance', { context: 'Navigation item.' } ) }
							/>
						</Route>
						<Route path="/setup">
							<Main routeName={ i18n.translate( 'Set up', { context: 'Navigation item.' } ) } />
						</Route>
						<Route path="/my-plan">
							<Main routeName={ i18n.translate( 'My Plan', { context: 'Navigation item.' } ) } />
						</Route>
						<Route path="/plans">
							<Main routeName={ i18n.translate( 'Plans', { context: 'Navigation item.' } ) } />
						</Route>
						<Route path="/plans-prompt">
							<Main routeName={ i18n.translate( 'Plans', { context: 'Navigation item.' } ) } />
						</Route>
						<Route path="/settings">
							<Main routeName={ i18n.translate( 'Settings', { context: 'Navigation item.' } ) } />
						</Route>
						<Route path="/discussion">
							<Main routeName={ i18n.translate( 'Discussion', { context: 'Navigation item.' } ) } />
						</Route>
						<Route path="/security">
							<Main routeName={ i18n.translate( 'Security', { context: 'Navigation item.' } ) } />
						</Route>
						<Route path="/performance">
							<Main
								routeName={ i18n.translate( 'Performance', { context: 'Navigation item.' } ) }
							/>
						</Route>
						<Route path="/traffic">
							<Main routeName={ i18n.translate( 'Traffic', { context: 'Navigation item.' } ) } />
						</Route>
						<Route path="/writing">
							<Main routeName={ i18n.translate( 'Writing', { context: 'Navigation item.' } ) } />
						</Route>
						<Route path="/sharing">
							<Main routeName={ i18n.translate( 'Sharing', { context: 'Navigation item.' } ) } />
						</Route>
						<Route path="/wpbody-content" component={ Main } />
						<Route path="/wp-toolbar" component={ Main } />
						<Route path="/privacy" component={ Main } />
						<Route path="/*">
							<Main
								routeName={ i18n.translate( 'At A Glance', { context: 'Navigation item.' } ) }
							/>
						</Route>
					</Switch>
				</HashRouter>
			</Provider>
		</div>,
		container
	);
}
