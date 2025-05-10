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

			const { getBlocks } = select( blockEditorStore );
			const directChildren = getBlocks( formClientId );

			if ( ! directChildren ) {
				return [];
			}

			// Try to find steps directly under the form
			let formStepBlocks = directChildren.filter( block => block.name === 'jetpack/form-step' );

			// If no direct steps, look for a step-container
			if ( formStepBlocks.length === 0 ) {
				const stepContainer = directChildren.find(
					block => block.name === 'jetpack/step-container'
				);

				if ( stepContainer ) {
					const blocksInContainer = getBlocks( stepContainer.clientId );
					if ( blocksInContainer ) {
						formStepBlocks = blocksInContainer.filter(
							block => block.name === 'jetpack/form-step'
						);
					}
				}
			}
			return formStepBlocks;
		},
		[ formClientId ]
	);
};

export default useFormSteps;
