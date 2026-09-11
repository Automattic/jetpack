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
import './design-tokens.scss';

const MyJetpack = () => {
	const container = document.getElementById( 'my-jetpack-container' );

	// Legacy-only; see Initializer::is_onboarding_takeover().
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
