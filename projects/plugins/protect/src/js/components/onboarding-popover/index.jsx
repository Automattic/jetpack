import { ActionPopover } from '@automattic/jetpack-components';
import { __ } from '@wordpress/i18n';
import { useContext, useEffect } from 'react';
import useOnboarding, { OnboardingRenderedContext } from '../../hooks/use-onboarding';

const OnboardingPopover = ( { id, anchor, position } ) => {
	const {
		stepsCount,
		currentStep,
		currentStepCount,
		completeCurrentStep,
		completeAllCurrentSteps,
	} = useOnboarding();

	// keep track of which onboarding steps are currently being rendered
	const { setRenderedSteps } = useContext( OnboardingRenderedContext );
	useEffect( () => {
		setRenderedSteps( currentRenderedSteps => [ ...currentRenderedSteps, id ] );

		return () => {
			setRenderedSteps( currentRenderedSteps =>
				currentRenderedSteps.filter( step => step !== id )
			);
		};
	}, [ id, setRenderedSteps ] );

	// do not render anything if this is not the current step
	if ( currentStep?.id !== id ) {
		return null;
	}

	return (
		<ActionPopover
			anchor={ anchor }
			title={ currentStep.title }
			noArrow={ false }
			children={ currentStep.description }
			buttonContent={
				currentStepCount < stepsCount
					? __( 'Next', 'jetpack-protect' )
					: __( 'Finish', 'jetpack-protect' )
			}
			onClick={ completeCurrentStep }
			onClose={ completeAllCurrentSteps }
			position={ position }
			step={ currentStepCount }
			totalSteps={ stepsCount }
		/>
	);
};

export default OnboardingPopover;
