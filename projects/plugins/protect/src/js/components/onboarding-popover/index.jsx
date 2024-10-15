import { ActionPopover } from '@automattic/jetpack-components';
import { __ } from '@wordpress/i18n';
import { useContext, useEffect } from 'react';
import useScanStatusQuery, { isScanInProgress } from '../../data/scan/use-scan-status-query';
import useOnboarding, { OnboardingRenderedContext } from '../../hooks/use-onboarding';

const OnboardingPopover = ( { id, anchor, position } ) => {
	const {
		stepsCount,
		currentStep,
		currentStepCount,
		completeCurrentStep,
		completeAllCurrentSteps,
	} = useOnboarding();

	const { data: status } = useScanStatusQuery( { usePolling: true } );

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

	// do not render if this is not the current step
	if ( currentStep?.id !== id ) {
		return null;
	}

	// do not render if the scan is in progress
	if ( isScanInProgress( status ) ) {
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
					: __( 'Finish', 'jetpack-protect', /* dummy arg to avoid bad minification */ 0 )
			}
			onClick={ currentStepCount < stepsCount ? completeCurrentStep : completeAllCurrentSteps }
			onClose={ completeAllCurrentSteps }
			position={ position }
			step={ currentStepCount }
			totalSteps={ stepsCount }
			offset={ 15 }
			flip={ false }
		/>
	);
};

export default OnboardingPopover;
