import { ThemeProvider } from '@automattic/jetpack-components';
import * as WPElement from '@wordpress/element';
import OnboardingWizardPage from '.';

/**
 * Initial render function.
 */
function render() {
	const container = document.getElementById( 'jetpack-crm-obw-root' );

	if ( null === container ) {
		return;
	}

	const component = (
		<ThemeProvider>
			<OnboardingWizardPage />
		</ThemeProvider>
	);

	WPElement.createRoot( container ).render( component );
}

render();
