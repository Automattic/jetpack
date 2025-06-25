import { useSelect } from '@wordpress/data';
import { useFindBlockRecursively } from './use-find-block-recursively';

/**
 * Custom hook to retrieve all 'jetpack/form-step' blocks within a given parent form block.
 *
 * This hook identifies the 'jetpack/step-container' block that is a descendant of the given formClientId
 * and returns its inner 'jetpack/form-step' blocks.
 *
 * @param {string} formClientId - The client ID of the parent 'jetpack/contact-form' block.
 * @return {Array}       An array of 'jetpack/form-step' block objects, or an empty array if none are found, the formClientId is invalid, or the step-container is not found.
 */
export default function useFormSteps( formClientId ) {
	const stepContainer = useFindBlockRecursively(
		formClientId,
		block => block.name === 'jetpack/form-step-container'
	);
	return useSelect( () => {
		if ( stepContainer && stepContainer.innerBlocks && stepContainer.innerBlocks.length > 0 ) {
			return stepContainer.innerBlocks;
		}
		return [];
	}, [ stepContainer ] );
}
