import { createPortal, useRef, useEffect } from '@wordpress/element';
import OnboardingGuide from './components/onboarding-guide';

import './style.scss';

const Onboarding = () => {
	const urlSearchParameters = new URLSearchParams( window.location.search );
	const shouldShowTour = urlSearchParameters.get( 'guide' ) === 'aiOnboarding';
	const portalParent = useRef( document.createElement( 'div' ) ).current;

	useEffect( () => {
		portalParent.classList.add( 'ai-assistant-onboarding-guide' );
		document.body.appendChild( portalParent );

		return () => {
			document.body.removeChild( portalParent );
		};
	}, [ portalParent ] );

	if ( ! shouldShowTour ) {
		return null;
	}

	return createPortal( <OnboardingGuide />, portalParent );
};

export default Onboarding;
