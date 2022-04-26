/**
 * External dependencies
 */
import React from 'react';
import ReactDOM from 'react-dom';
import { ThemeProvider } from '@automattic/jetpack-components';

/**
 * Internal dependencies
 */
import AdminPage from './components/admin-page';
import { initStore } from './state/store';
import './styles.module.scss';

// Initialize Jetpack Protect store
initStore();

/**
 * Initial render function.
 */
function render() {
	const container = document.getElementById( 'jetpack-protect-root' );

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
