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
import { Page as AtAGlance } from 'at-a-glance';
import Engagement from 'engagement/Page.jsx';
import Security from 'security/Page.jsx';
import GeneralSettings from 'general-settings/index.jsx';
import More from 'more/Page.jsx';
import Navigation from 'components/navigation';

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