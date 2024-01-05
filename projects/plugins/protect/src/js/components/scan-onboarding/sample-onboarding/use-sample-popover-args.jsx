import { Text } from '@automattic/jetpack-components';
import { __ } from '@wordpress/i18n';
import useOnboarding from '../../../hooks/use-onboarding';

// This is a sample use popover args hook that can be used as a template for creating new onboarding components.
const useSamplePopoverArgs = ( { anchors, totalSteps } ) => {
	// Retrieve onboarding methods
	const { incrementOnboardingStep, dismissOnboarding, createPopoverArgs } = useOnboarding();

	// Return args for each popover
	return {
		stepOne: createPopoverArgs( {
			title: __( 'Step 1', 'jetpack-protect' ),
			buttonContent: __( 'Next', 'jetpack-protect' ),
			anchor: anchors.stepOne,
			onClick: () => incrementOnboardingStep( totalSteps ),
			position: 'middle top',
			step: 1,
			totalSteps: totalSteps,
			children: (
				<Text>
					{ __(
						'This is the first step of the onboarding process. You can click the button below to continue.',
						'jetpack-protect'
					) }
				</Text>
			),
		} ),

		stepTwo: createPopoverArgs( {
			title: __( 'Step 2', 'jetpack-protect' ),
			buttonContent: __( 'Next', 'jetpack-protect' ),
			anchor: anchors.stepTwo,
			onClick: () => incrementOnboardingStep( totalSteps ),
			position: 'middle top',
			step: 2,
			totalSteps: totalSteps,
			children: (
				<Text>
					{ __(
						'This is step two of the onboarding process. Click the button below to continue.',
						'jetpack-protect'
					) }
				</Text>
			),
		} ),

		stepThree: createPopoverArgs( {
			title: __( 'Step 3', 'jetpack-protect' ),
			buttonContent: __( 'Next', 'jetpack-protect' ),
			anchor: anchors.stepThree,
			onClick: () => incrementOnboardingStep( totalSteps ),
			position: 'middle top',
			step: 3,
			totalSteps: totalSteps,
			children: (
				<Text>
					{ __(
						'Step three of the onboarding process. Click Next to continue.',
						'jetpack-protect'
					) }
				</Text>
			),
		} ),

		stepFour: createPopoverArgs( {
			title: __( 'Step 4', 'jetpack-protect' ),
			buttonContent: __( 'Next', 'jetpack-protect' ),
			anchor: anchors.StepFour,
			onClick: () => incrementOnboardingStep( totalSteps ),
			position: 'middle top',
			step: 4,
			totalSteps: totalSteps,
			children: <Text>{ __( 'This is step four. Next to continue.', 'jetpack-protect' ) }</Text>,
		} ),

		stepFive: createPopoverArgs( {
			title: __( 'Step 5', 'jetpack-protect' ),
			buttonContent: __( 'Finish', 'jetpack-protect' ),
			anchor: anchors.stepFive,
			onClick: dismissOnboarding,
			position: 'middle top',
			step: totalSteps,
			totalSteps: totalSteps,
			children: (
				<Text>{ __( 'Final step. Click the button below to Finish.', 'jetpack-protect' ) }</Text>
			),
		} ),
	};
};

export default useSamplePopoverArgs;
