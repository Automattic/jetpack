/**
 * External dependencies
 */
import ReactDOM from 'react-dom';
import React from 'react';
import { HashRouter, Routes, Route } from 'react-router-dom';

/**
 * Internal dependencies
 */
import MyJetpackScreen from './components/my-jetpack-screen';
import { initStore } from './state/store';
import useRouteBlocker from './hooks/use-route-blocker';

initStore();

// @TODO Remove as soon new routes arrives
const New = () => {
	useRouteBlocker();
	return <div>New</div>;
};

/**
 * The initial renderer function.
 */
function render() {
	const container = document.getElementById( 'my-jetpack-container' );

	if ( null === container ) {
		return;
	}

	ReactDOM.render(
		<HashRouter>
			<Routes>
				<Route path="/" element={ <MyJetpackScreen /> } />
				<Route path="/new" element={ <New /> } />
			</Routes>
		</HashRouter>,
		container
	);
}

render();
