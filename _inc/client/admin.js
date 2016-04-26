/**
 * External dependencies
 */
import ReactDOM from 'react-dom';
import React from 'react';
import { Provider } from 'react-redux';
import { Route, Router, hashHistory } from 'react-router';
import { syncHistoryWithStore } from 'react-router-redux';

/**
 * Internal dependencies
 */
import store from 'state/redux-store';
import Main from 'main';

const history = syncHistoryWithStore( hashHistory, store );
const hash = window.location.hash ? window.location.hash.substring( 1 ) : '/';

ReactDOM.render(
	<div>
		<Provider store={ store }>
			<Router history={ history }>
				<Route path={ hash.substring( 0, hash.indexOf( '?' ) ) } component={ Main } />
			</Router>
		</Provider>

	</div>,
	document.getElementById( 'jp-plugin-container' )
);