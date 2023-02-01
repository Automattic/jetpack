import { ThemeProvider } from '@automattic/jetpack-components';
import React from 'react';
import ReactDOM from 'react-dom/client';
import AdminPage from './components/admin-page';

/**
 * Initial render function.
 */
function render() {
	const container = document.getElementById( 'jetpack-migration-root' );

	if ( null === container ) {
		return;
	}

	ReactDOM.createRoot( container ).render(
		<ThemeProvider>
			<AdminPage />
		</ThemeProvider>
	);
}

render();
