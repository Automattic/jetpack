import { ThemeProvider } from '@automattic/jetpack-components';
import { SocialAdminPage } from '@automattic/jetpack-publicize-components';
import * as WPElement from '@wordpress/element';
import React from 'react';

/**
 * Initial render function.
 */
function render() {
	const container = document.getElementById( 'jetpack-social-root' );

	if ( null === container ) {
		return;
	}

	const component = (
		<ThemeProvider targetDom={ document.body }>
			<SocialAdminPage />
		</ThemeProvider>
	);
	WPElement.createRoot( container ).render( component );
}

render();
