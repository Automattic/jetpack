import { useDispatch, useSelect } from '@wordpress/data';
import { useCallback } from 'react';
import { STORE_ID } from '../../state/store';

const useOnboarding = () => {
	const { setOnboardingStep } = useDispatch( STORE_ID );
	const onboardingStep = useSelect( select => select( STORE_ID ).getOnboardingStep() );

	const incrementOnboardingStep = useCallback(
		totalSteps => {
			if ( onboardingStep === totalSteps ) {
				setOnboardingStep( null );
				return;
			}
			setOnboardingStep( onboardingStep + 1 );
		},
		[ onboardingStep, setOnboardingStep ]
	);

	const closeOnboarding = useCallback( () => {
		setOnboardingStep( null );
	}, [ setOnboardingStep ] );

	const dismissOnboarding = useCallback(
		onDismissCallback => {
			if ( onDismissCallback && typeof onDismissCallback === 'function' ) {
				// If applicable, set dismissal flags
				onDismissCallback();
			}
			setOnboardingStep( null );
		},
		[ setOnboardingStep ]
	);

	const resetOnboarding = useCallback( () => {
		// If not dismissed and not the initial step, reset
		if ( onboardingStep !== null && onboardingStep !== 1 ) {
			setOnboardingStep( 1 );
		}
	}, [ onboardingStep, setOnboardingStep ] );

	const createPopoverArgs = ( {
		title,
		buttonContent,
		anchor,
		onClick,
		position,
		step,
		totalSteps,
		children,
	} ) => ( {
		title,
		buttonContent,
		anchor,
		onClose: closeOnboarding,
		onClick,
		noArrow: false,
		position,
		offset: 15,
		step,
		totalSteps,
		children,
	} );

	const getCurrentPopoverArgs = useCallback(
		onboardingStepHandlers => {
			const handler = onboardingStepHandlers[ onboardingStep ];
			return handler ? handler() : null;
		},
		[ onboardingStep ]
	);

	const resetOnboardingOnAnchorRegeneration = useCallback(
		anchors => {
			if ( Object.keys( anchors ).length === 0 ) {
				resetOnboarding();
			}
		},
		[ resetOnboarding ]
	);

	return {
		onboardingStep,
		incrementOnboardingStep,
		closeOnboarding,
		dismissOnboarding,
		createPopoverArgs,
		getCurrentPopoverArgs,
		resetOnboardingOnAnchorRegeneration,
	};
};

export default useOnboarding;
