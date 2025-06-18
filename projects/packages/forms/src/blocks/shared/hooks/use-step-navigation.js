import { store as blockEditorStore } from '@wordpress/block-editor';
import { useDispatch, useSelect } from '@wordpress/data';
import { useCallback } from '@wordpress/element';
import { store as singleStepStore } from '../../../store/form-step-preview';
import useFormSteps from './use-form-steps';

/**
 * Custom hook to manage navigation between form steps.
 *
 * This hook provides navigation functions that work consistently
 * regardless of component mounting/unmounting, making it ideal
 * for multi-step form navigation.
 *
 * @param {string}  formClientId       - The client ID of the parent form block
 * @param {boolean} updateStepSelected - Flag to indicate if the step should be selected
 * @return {object} Navigation functions and state
 */
const useStepNavigation = ( formClientId, updateStepSelected ) => {
	const { setActiveStep } = useDispatch( singleStepStore );
	const { selectBlock } = useDispatch( blockEditorStore );
	const steps = useFormSteps( formClientId );

	const currentStepInfo = useSelect(
		select => select( singleStepStore ).getCurrentStepInfo( formClientId, steps ),
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
		setActiveStep( formClientId, nextStepId );
		if ( updateStepSelected ) {
			// If the current step is selected, we need to deselect it
			selectBlock( nextStepId );
		}
	}, [ currentStepInfo, steps, setActiveStep, formClientId, updateStepSelected, selectBlock ] );

	// Navigate to the previous step
	const navigateToPreviousStep = useCallback( () => {
		const { index, isFirstStep } = currentStepInfo;

		// Don't navigate if we're already at the first step
		if ( isFirstStep || ! steps.length ) {
			return;
		}

		const prevStepId = steps[ index - 1 ].clientId;
		setActiveStep( formClientId, prevStepId );
		if ( updateStepSelected ) {
			// If the current step is selected, we need to deselect it
			selectBlock( prevStepId );
		}
	}, [ currentStepInfo, steps, setActiveStep, formClientId, updateStepSelected, selectBlock ] );

	// Navigate to a specific step by index
	const navigateToStep = useCallback(
		stepIndex => {
			if ( stepIndex < 0 || stepIndex >= steps.length ) {
				return;
			}

			const stepId = steps[ stepIndex ].clientId;
			setActiveStep( formClientId, stepId );
			if ( updateStepSelected ) {
				// If the current step is selected, we need to deselect it
				selectBlock( stepId );
			}
		},
		[ steps, setActiveStep, formClientId, updateStepSelected, selectBlock ]
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
