/**
 * External dependencies
 */
import ReactDOM from 'react-dom';
import React from 'react';
import { Provider } from 'react-redux';
import { Route, Router, useRouterHistory } from 'react-router';
import { syncHistoryWithStore } from 'react-router-redux';
import { createHashHistory } from 'history'

/**
 * Internal dependencies
 */
import accessibleFocus from 'lib/accessible-focus';
import store from 'state/redux-store';
import i18n from 'i18n-calypso';
import Main from 'main';

// Initialize the accessibile focus to allow styling specifically for keyboard navigation
accessibleFocus();

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

const hashHistory = useRouterHistory( createHashHistory )( { queryKey: false } );

const history = syncHistoryWithStore( hashHistory, store );

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
					<Route path='/' name={ i18n.translate( 'At A Glance', { context: 'Navigation item.' } ) } component={ Main } />
					<Route path='/jumpstart' component={ Main } />
					<Route path='/dashboard' name={ i18n.translate( 'At A Glance' ) } component={ Main } />
					<Route path='/apps' name={ i18n.translate( 'Apps', { context: 'Navigation item.' } ) } component={ Main } />
					<Route path='/plans' name={ i18n.translate( 'Plans', { context: 'Navigation item.' } ) } component={ Main } />
					<Route path='/settings' name={ i18n.translate( 'General', { context: 'Navigation item.' } ) } component={ Main } />
					<Route path='/general' name={ i18n.translate( 'General', { context: 'Navigation item.' } ) } component={ Main } />
					<Route path='/engagement' name={ i18n.translate( 'Engagement', { context: 'Navigation item.' } ) } component={ Main } />
					<Route path='/security' name={ i18n.translate( 'Security', { context: 'Navigation item.' } ) } component={ Main } />
					<Route path='/appearance' name={ i18n.translate( 'Appearance', { context: 'Navigation item.' } ) } component={ Main } />
					<Route path='/writing' name={ i18n.translate( 'Writing', { context: 'Navigation item.' } ) } component={ Main } />
					<Route path='/search' component={ Main } />
					<Route path="*" />
				</Router>
			</Provider>
		</div>,
		container
	);
}
