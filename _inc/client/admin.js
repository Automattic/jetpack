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

const history = syncHistoryWithStore( hashHistory, store );

ReactDOM.render(
	<div>
		<Masthead />
		<div className="jp-lower">
			<Provider store={ store }>
				<Router history={ history }>
					<Route path="/" component={ Navigation } />
					<Route path="dashboard" component={ Navigation } />
					<Route path="engagement" component={ Navigation } />
					<Route path="security" component={ Navigation } />
					<Route path="health" component={ Navigation } />
					<Route path="more" component={ Navigation } />
					<Route path="general" component={ Navigation } />
				</Router>
			</Provider>
		</div>
	</div>,
	document.getElementById( 'jp-plugin-container' )
);