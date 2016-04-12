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
import Navigation from 'components/navigation';
import Masthead from 'components/masthead';
import Footer from 'components/footer';

const history = syncHistoryWithStore( hashHistory, store );
const hash = window.location.hash ? window.location.hash.substring( 1 ) : '/';

ReactDOM.render(
	<div>
		<Masthead />
		<div className="jp-lower">
			<Provider store={ store }>
				<Router history={ history }>
					<Route path={ hash.substring( 0, hash.indexOf( '?' ) ) } component={ Navigation } />
				</Router>
			</Provider>
			<Footer />
		</div>
	</div>,
	document.getElementById( 'jp-plugin-container' )
);