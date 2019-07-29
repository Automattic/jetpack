/**
 * External dependencies
 */
import ReactDOM from 'react-dom';
import React from 'react';
import { Provider, connect } from 'react-redux';
import { assign, get } from 'lodash';

/**
 * Internal dependencies
 */
import accessibleFocus from 'lib/accessible-focus';
import store from 'state/redux-store';
import i18n from 'i18n-calypso';
import ConnectButton from 'components/connect-button';
import * as actionTypes from 'state/action-types';
import restApi from 'rest-api';
import {
	setInitialState,
	// getSiteRawUrl,
	// getSiteAdminUrl,
	getApiNonce,
	getApiRootUrl,
	getJetpackDashboardUrl,
	// userCanManageModules,
	// userCanConnectSite,
	// getCurrentVersion,
	getTracksUserData,
} from 'state/initial-state';
import { getSiteConnectionStatus } from 'state/connection';

// TODO figure out what's actually necessary here. Most of this boilerplate was copied from admin.js

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

class Main extends React.Component {
	UNSAFE_componentWillMount() {
		this.props.setInitialState();
		restApi.setApiRoot( this.props.apiRoot );
		restApi.setApiNonce( this.props.apiNonce );
	}

	componentDidUpdate( prevProps, prevState, snapshot ) {
		if (
			this.props.siteConnectionStatus &&
			this.props.siteConnectionStatus != prevProps.siteConnectionStatus &&
			this.props.redirectOnConnected
		) {
			window.location.href = this.props.redirectOnConnected;
		}
	}

	handleOnConnected() {
		if ( this.props.onConnected ) {
			this.props.onConnected();
		}
	}

	render() {
		if ( this.props.siteConnectionStatus ) {
			return <h3>Redirecting...</h3>;
		}

		return <ConnectButton from={ 'full-screen-prompt' } />;
	}
}

const ConnectedMain = connect(
	state => {
		return {
			siteConnectionStatus: getSiteConnectionStatus( state ),
			// isLinked: isCurrentUserLinked( state ),
			// siteRawUrl: getSiteRawUrl( state ),
			// siteAdminUrl: getSiteAdminUrl( state ),
			// searchTerm: getSearchTerm( state ),
			redirectOnConnected: getJetpackDashboardUrl( state ),
			apiRoot: getApiRootUrl( state ),
			apiNonce: getApiNonce( state ),
			tracksUserData: getTracksUserData( state ),
		};
	},
	dispatch => ( {
		setInitialState: () => {
			return dispatch( setInitialState() );
		},
	} )
)( Main );

render();

function render() {
	const container = document.getElementById( 'jp-connect-full__button-container' );

	if ( container === null ) {
		return;
	}
	//
	ReactDOM.render(
		<Provider store={ store }>
			<ConnectedMain />
		</Provider>,
		container
	);
}
