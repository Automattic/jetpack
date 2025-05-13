import { store as blockEditorStore } from '@wordpress/block-editor';
import { useSelect } from '@wordpress/data';

/**
 * Custom hook to retrieve all 'jetpack/form-step' blocks within a given parent form block.
 *
 * This hook handles cases where steps are direct children of the form
 * or nested within a 'jetpack/step-container' block.
 *
 * @param {string} formClientId - The client ID of the parent 'jetpack/contact-form' block.
 * @return {Array} An array of 'jetpack/form-step' block objects, or an empty array if none are found or the formClientId is invalid.
 */
const useFormSteps = formClientId => {
	return useSelect(
		select => {
			if ( ! formClientId ) {
				return [];
			}

			const { getBlocks, getBlocksByName, getBlockParentsByBlockName } = select( blockEditorStore );

			// since you can have multiple forms on a page, we need to check if the formClientId is in the parent form
			const stepContainers = getBlocksByName( 'jetpack/step-container' );

			if ( ! stepContainers || stepContainers.length === 0 ) {
				return { steps: [], containerId: null };
			}

			const containerId = stepContainers.find( stepContainerId => {
				const parentId = getBlockParentsByBlockName( stepContainerId, [
					'jetpack/contact-form',
				] )[ 0 ];
				return parentId && parentId === formClientId;
			} );

			if ( ! containerId ) {
				return { steps: [], containerId: null };
			}

			const steps = getBlocks( containerId );
			if ( ! steps ) {
				return { steps: [], containerId: containerId };
			}

			return { steps, containerId };
		},
		[ formClientId ]
	);
};

export default useFormSteps;
