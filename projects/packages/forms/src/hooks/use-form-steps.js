import { store as blockEditorStore } from '@wordpress/block-editor';
import { useSelect } from '@wordpress/data';
import useContainerId from './use-container-id';

/**
 * Custom hook to retrieve all 'jetpack/form-step' blocks within a given parent form block.
 *
 * This hook handles cases where steps are direct children of the form
 * or nested within a 'jetpack/step-container' block.
 *
 * @param {string} formClientId - The client ID of the parent 'jetpack/contact-form' block.
 * @return {Array} An array of 'jetpack/form-step' block objects, or an empty array if none are found or the formClientId is invalid.
 */
export default function useFormSteps( formClientId ) {
	const containerId = useContainerId( formClientId );
	return useSelect(
		select => {
			if ( ! containerId ) {
				return [];
			}
			const { getBlocks } = select( blockEditorStore );
			return getBlocks( containerId );
		},
		[ containerId ]
	);
}
