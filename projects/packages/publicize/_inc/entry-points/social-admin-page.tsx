import '../utils/public-path.js';
import { ThemeProvider } from '@automattic/jetpack-components';
import * as WPElement from '@wordpress/element';
import { Tooltip } from '@wordpress/ui';
import { SocialAdminPage } from '../components/admin-page';

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
			<Tooltip.Provider delay={ 0 }>
				<SocialAdminPage />
			</Tooltip.Provider>
		</ThemeProvider>
	);
	WPElement.createRoot( container ).render( component );
}

render();
