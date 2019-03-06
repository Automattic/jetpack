/**
 * External dependencies
 */
import React from 'react';
import { Route, Router, useRouterHistory } from 'react-router';
import { createHashHistory } from 'history';
// @TODO redux...

/**
 * Internal dependencies
 */
import './store';
//import reduxStore from 'state/redux-store';
import InputScreen from './input-screen';
import AuthorMapping from './author-mapping';
import ImportComplete from './import-complete';

// @TODO I didn't figure out how to use this history... I just set window.location /shrug
const hashHistory = useRouterHistory( createHashHistory )();

function UnifiedImporter() {
	return (
		<Router history={ hashHistory }>
			<Route exact path="/" component={ InputScreen } />
			<Route path="/map" component={ AuthorMapping } />
			<Route path="/complete" component={ ImportComplete } />
		</Router>
	);
}

export default UnifiedImporter;
