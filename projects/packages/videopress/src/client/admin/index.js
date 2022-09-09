import { ThemeProvider } from '@automattic/jetpack-components';
import React from 'react';
import ReactDOM from 'react-dom';
import { initStore } from '../state';
import AdminPage from './components/admin-page';

initStore();

/**
 * Initial render function.
 */
function render() {
	const container = document.getElementById( 'jetpack-videopress-root' );

	if ( null === container ) {
		return;
	}

	ReactDOM.render(
		<ThemeProvider>
			<AdminPage />
		</ThemeProvider>,
		container
	);
}

render();
