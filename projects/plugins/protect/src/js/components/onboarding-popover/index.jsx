import { ActionPopover } from '@automattic/jetpack-components';
import { __ } from '@wordpress/i18n';
import useOnboarding from '../../hooks/use-onboarding';

const OnboardingPopover = ( { id, anchor, position } ) => {
	const {
		stepsCount,
		currentStep,
		currentStepCount,
		completeCurrentStep,
		completeAllCurrentSteps,
	} = useOnboarding();

	// do not render if this is not the current step
	if ( currentStep?.id !== id ) {
		return null;
	}

	return (
		<ActionPopover
			anchor={ anchor }
			title={ currentStep.title }
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
