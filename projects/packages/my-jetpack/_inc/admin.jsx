/**
 * External dependencies
 */
import { createRoot } from '@wordpress/element';
/**
 * Internal dependencies
 */
import App from './app';
import OnboardingScreen from './components/onboarding-screen';
import Providers from './providers';

const MyJetpack = () => {
	const container = document.getElementById( 'my-jetpack-container' );

	// The onboarding takeover is legacy-only: it hides all wp-admin chrome and
	// never renders through wp-build, so it stays behind this entry's container.
	if ( container?.dataset?.route === 'onboarding' ) {
		return (
			<Providers>
				<OnboardingScreen />
			</Providers>
		);
	}

	return <App />;
};

/**
 * The initial renderer function.
 */
function render() {
	const container = document.getElementById( 'my-jetpack-container' );
	if ( null === container ) {
		return;
	}

	createRoot( container ).render( <MyJetpack /> );
}

render();
