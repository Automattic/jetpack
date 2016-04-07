/**
 * External dependencies
 */
import ReactDOM from 'react-dom';
import React from 'react';
import {Provider} from 'react-redux';

/**
 * Internal dependencies
 */
import store from 'state/redux-store';
import Navigation from 'components/navigation';
import Masthead from 'components/masthead';

ReactDOM.render(
	<div>
		<Masthead />
		<div className="jp-lower">
			<Provider store={store}>
				<Navigation />
			</Provider>
		</div>
	</div>,
	document.getElementById( 'jp-plugin-container' )
);