import { useDispatch, useSelect } from '@wordpress/data';
import { useCallback } from '@wordpress/element';
import { store as previewStore } from '../store/preview-store';
import useFormSteps from './use-form-steps';

/**
 * Custom hook to manage navigation between form steps.
 *
 * This hook provides navigation functions that work consistently
 * regardless of component mounting/unmounting, making it ideal
 * for multi-step form navigation.
 *
 * @param {string} formClientId - The client ID of the parent form block
 * @return {object} Navigation functions and state
 */
const useStepNavigation = formClientId => {
	const { setPreviewStep } = useDispatch( previewStore );
	const steps = useFormSteps( formClientId );

	const { currentStepInfo } = useSelect(
		select => {
			const { getCurrentStepInfo } = select( previewStore );
			return {
				currentStepInfo: getCurrentStepInfo( formClientId, steps ),
			};
		},
		[ formClientId, steps ]
	);

	// Navigate to the next step
	const navigateToNextStep = useCallback( () => {
		const { index, isLastStep } = currentStepInfo;

		// Don't navigate if we're already at the last step
		if ( isLastStep || ! steps.length ) {
			return;
		}

		const nextStepId = steps[ index + 1 ].clientId;
		setPreviewStep( formClientId, nextStepId );
	}, [ currentStepInfo, steps, setPreviewStep, formClientId ] );

	// Navigate to the previous step
	const navigateToPreviousStep = useCallback( () => {
		const { index, isFirstStep } = currentStepInfo;

		// Don't navigate if we're already at the first step
		if ( isFirstStep || ! steps.length ) {
			return;
		}

		const prevStepId = steps[ index - 1 ].clientId;
		setPreviewStep( formClientId, prevStepId );
	}, [ currentStepInfo, steps, setPreviewStep, formClientId ] );

	// Navigate to a specific step by index
	const navigateToStep = useCallback(
		stepIndex => {
			if ( stepIndex < 0 || stepIndex >= steps.length ) {
				return;
			}

			const stepId = steps[ stepIndex ].clientId;
			setPreviewStep( formClientId, stepId );
		},
		[ steps, setPreviewStep, formClientId ]
	);

	return {
		navigateToNextStep,
		navigateToPreviousStep,
		navigateToStep,
		currentStepInfo,
		steps,
	};
};

export default useStepNavigation;
