import { Button, Text } from '@automattic/jetpack-components';
import { sprintf, __ } from '@wordpress/i18n';
import useOnboarding from '../../hooks/use-onboarding';

const OnboardingStep = ( { id } ) => {
	const { stepsCount, currentStep, currentStepCount, completeAllCurrentSteps } = useOnboarding();

	const handleDismissClick = () => {
		return event => {
			event.preventDefault();
			completeAllCurrentSteps();
		};
	};

	// do not render if this is not the current step
	if ( currentStep?.id !== id ) {
		return null;
	}

	return (
		<div>
			<Text variant="title-medium">{ currentStep.title }</Text>
			<Text>{ currentStep.description }</Text>
			{ sprintf(
				/* translators: placeholders are the current onboarding item number and the total amount of onboarding items */
				__( '%1$s of %2$s', 'jetpack-protect' ),
				currentStepCount,
				stepsCount
			) }
			<Button onClick={ handleDismissClick() }>
				{ currentStepCount < stepsCount
					? __( 'Next', 'jetpack-protect' )
					: __( 'Finish', 'jetpack-protect' ) }
			</Button>
		</div>
	);
};

export default OnboardingStep;
