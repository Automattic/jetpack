/**
 * External dependencies
 */
import ReactDOM from 'react-dom';
import React from 'react';
import { Provider } from 'react-redux';
import { Route, Router, hashHistory } from 'react-router';
import { syncHistoryWithStore } from 'react-router-redux';
import analytics from 'lib/analytics';

const tracksUser = window.Initial_State.tracksUserData;
if ( tracksUser ) {
	analytics.initialize(
		tracksUser.userid,
		tracksUser.username
	);
}

/**
 * Internal dependencies
 */
import store from 'state/redux-store';
import i18n from 'i18n-calypso';
import Main from 'main';

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

const history = syncHistoryWithStore( hashHistory, store );

ReactDOM.render(
	<div>
		<Provider store={ store }>
			<Router history={ history }>
				<Route path='/' component={ Main } />
				<Route path='/dashboard' component={ Main } />
				<Route path='/engagement' component={ Main } />
				<Route path='/security' component={ Main } />
				<Route path='/health' component={ Main } />
				<Route path='/more' component={ Main } />
				<Route path='/general' component={ Main } />
			</Router>
		</Provider>

	</div>,
	document.getElementById( 'jp-plugin-container' )
);
