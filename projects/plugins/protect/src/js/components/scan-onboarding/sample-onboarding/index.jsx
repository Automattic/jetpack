import { ActionPopover } from '@automattic/jetpack-components';
import { useMemo, useEffect } from 'react';
import useOnboarding from '../../../hooks/use-onboarding';
import useSamplePopoverArgs from './use-sample-popover-args';

// This is a sample onboarding component that can be used as a template for creating new onboarding components.
const SampleOnboarding = ( { anchors } ) => {
	// Retrieve onboarding state and methods
	const { onboardingStep, resetOnboarding, getCurrentPopoverArgs } = useOnboarding();

	// Define total steps
	const totalSteps = 5;

	// Retrieve args defined for each popover
	const popoverArgs = useSamplePopoverArgs( { anchors, totalSteps } );

	// Define logic for determining which popover args to use
	const sampleOnboardingStepHandlers = {
		// Handle step 1
		1: () => {
			return popoverArgs.stepOne;
		},
		// Handle step 2
		2: () => {
			return popoverArgs.stepTwo;
		},
		// Handle step 3
		3: () => {
			return popoverArgs.stepThree;
		},
		// Handle step 4
		4: () => {
			return popoverArgs.stepFour;
		},
		// Handle step 5
		5: () => {
			return popoverArgs.stepFive;
		},
	};

	// Retrieve args for current popover
	const sampleOnboardingPopoverArgs = useMemo( () => {
		return getCurrentPopoverArgs( sampleOnboardingStepHandlers );
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [ onboardingStep ] );

	// Reset onboarding when anchors reset before regenerating
	useEffect( () => {
		if ( Object.keys( anchors ).length === 0 ) {
			resetOnboarding();
		}
	}, [ anchors, resetOnboarding ] );

	return <ActionPopover { ...sampleOnboardingPopoverArgs } />;
};

export default SampleOnboarding;
