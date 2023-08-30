import { ThemeProvider } from '@automattic/jetpack-components';
import { render } from '@wordpress/element';
import React from 'react';
import AdminPage from './components/admin-page';

/**
 * Initial render function.
 */
function renderSocialApp() {
	const container = document.getElementById( 'jetpack-social-root' );

	if ( null === container ) {
		return;
	}

	render(
		<ThemeProvider>
			<AdminPage />
		</ThemeProvider>,
		container
	);
}

renderSocialApp();
