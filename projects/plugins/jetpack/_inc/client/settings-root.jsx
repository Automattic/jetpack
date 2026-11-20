import { Provider } from 'react-redux';
import { HashRouter, Route, Routes } from 'react-router';
import accessibleFocus from 'lib/accessible-focus';
import Main from 'main';
import * as actionTypes from 'state/action-types';
import store from 'state/redux-store';

// Initialize the accessible focus to allow styling specifically for keyboard navigation
accessibleFocus();

// Add dispatch and actionTypes to the window object so we can use it from the browser's console
// eslint-disable-next-line no-undef -- both bundlers define process.env.NODE_ENV
if ( 'undefined' !== typeof window && process.env.NODE_ENV === 'development' ) {
	Object.assign( window, {
		actionTypes: actionTypes,
		dispatch: store.dispatch,
	} );
}

/**
 * The Settings app, rendered by the wp-build stage.
 *
 * @return {import('react').ReactElement} The app.
 */
export default function SettingsRoot() {
	return (
		<div>
			<Provider store={ store }>
				<HashRouter>
					<Routes>
						<Route path="/*" element={ <Main /> } />
					</Routes>
				</HashRouter>
			</Provider>
		</div>
	);
}
