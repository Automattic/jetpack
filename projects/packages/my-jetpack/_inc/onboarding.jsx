/**
 * External dependencies
 */
import { createRoot } from '@wordpress/element';
/**
 * Internal dependencies
 */
import './style.module.scss';
import OnboardingScreen from './components/onboarding-screen';
import Providers from './providers';
import './design-tokens.scss';

/**
 * Render the onboarding takeover; the dashboard renders through wp-build.
 */
function render() {
	const container = document.getElementById( 'my-jetpack-container' );
	if ( null === container ) {
		return;
	}

	createRoot( container ).render(
		<Providers>
			<OnboardingScreen />
		</Providers>
	);
}

render();
