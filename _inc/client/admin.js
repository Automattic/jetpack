/**
 * External dependencies
 */
import ReactDOM from 'react-dom';
import React from 'react';
import { Provider } from 'react-redux';
import { Route, Router, useRouterHistory } from 'react-router';
import { syncHistoryWithStore } from 'react-router-redux';
import { createHashHistory } from 'history';
import assign from 'lodash/assign';
import injectTapEventPlugin from 'react-tap-event-plugin';
injectTapEventPlugin();

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

const hashHistory = useRouterHistory( createHashHistory )();

const history = syncHistoryWithStore( hashHistory, store );

// Add dispatch and actionTypes to the window object so we can use it from the browser's console
if ( 'undefined' !== typeof window && process.env.NODE_ENV === 'development' ) {
	assign( window, {
		actionTypes: actionTypes,
		dispatch: store.dispatch,
	} );
}

render();

function render() {
	const container = document.getElementById( 'jp-plugin-container' );

	if ( container === null ) {
		return;
	}

	ReactDOM.render(
		<div>
			<Provider store={ store }>
				<Router history={ history }>
					<Route path="/" name={ i18n.translate( 'At A Glance', { context: 'Navigation item.' } ) } component={ Main } />
					<Route path="/jumpstart" component={ Main } />
					<Route path="/dashboard" name={ i18n.translate( 'At A Glance' ) } component={ Main } />
					<Route path="/plans" name={ i18n.translate( 'Plans', { context: 'Navigation item.' } ) } component={ Main } />
					<Route path="/settings" name={ i18n.translate( 'Settings', { context: 'Navigation item.' } ) } component={ Main } />
					<Route path="/discussion" name={ i18n.translate( 'Discussion', { context: 'Navigation item.' } ) } component={ Main } />
					<Route path="/security" name={ i18n.translate( 'Security', { context: 'Navigation item.' } ) } component={ Main } />
					<Route path="/traffic" name={ i18n.translate( 'Traffic', { context: 'Navigation item.' } ) } component={ Main } />
					<Route path="/writing" name={ i18n.translate( 'Writing', { context: 'Navigation item.' } ) } component={ Main } />
					<Route path="/sharing" name={ i18n.translate( 'Sharing', { context: 'Navigation item.' } ) } component={ Main } />
					<Route path="/wpbody-content" component={ Main } />
					<Route path="/wp-toolbar" component={ Main } />
					<Route path="/privacy" component={ Main } />
					<Route path="*" component={ Main } />
				</Router>
			</Provider>
		</div>,
		container
	);
}
