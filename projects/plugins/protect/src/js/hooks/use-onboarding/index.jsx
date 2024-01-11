import { useDispatch, useSelect } from '@wordpress/data';
import { STORE_ID } from '../../state/store';

const useOnboarding = () => {
	const { setOnboardingStep } = useDispatch( STORE_ID );
	const onboardingStep = useSelect( select => select( STORE_ID ).getOnboardingStep() );

	const incrementOnboardingStep = totalSteps => {
		if ( onboardingStep === totalSteps ) {
			setOnboardingStep( null );
			return;
		}
		setOnboardingStep( onboardingStep + 1 );
	};

	const closeOnboarding = () => {
		setOnboardingStep( null );
	};

	const dismissOnboarding = onDismissCallback => {
		if ( onDismissCallback && typeof onDismissCallback === 'function' ) {
			// If applicable, set dismissal flags
			onDismissCallback();
		}
		setOnboardingStep( null );
	};

	const resetOnboarding = () => {
		// If not dismissed and not the initial step, reset
		if ( onboardingStep !== null && onboardingStep !== 1 ) {
			setOnboardingStep( 1 );
		}
	};

	const resetOnboardingOnAnchorRegeneration = anchors => {
		if ( Object.keys( anchors ).length === 0 ) {
			resetOnboarding();
		}
	};

	const commonPopoverArgs = {
		onClose: closeOnboarding,
		noArrow: false,
		offset: 15,
	};

	const getCurrentPopoverArgs = onboardingStepHandlers => {
		const handler = onboardingStepHandlers[ onboardingStep ];
		return handler ? handler() : null;
	};

	return {
		onboardingStep,
		commonPopoverArgs,
		incrementOnboardingStep,
		closeOnboarding,
		dismissOnboarding,
		resetOnboardingOnAnchorRegeneration,
		getCurrentPopoverArgs,
	};
};

export default useOnboarding;
