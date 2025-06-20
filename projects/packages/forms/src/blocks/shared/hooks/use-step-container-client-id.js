import { store as blockEditorStore } from '@wordpress/block-editor';
import { useSelect } from '@wordpress/data';

/**
 * Custom hook to retrieve the container ID of a 'jetpack/contact-form' block.
 *
 * The container could be places anywhere in the DOM, so we need to check
 * if the formClientId is in the parent form. ( since the document could have multiple forms )
 *
 * @param {string} formClientId - The client ID of the parent 'jetpack/contact-form' block.
 * @return {string|null} The client ID of the 'jetpack/step-container' block, or null if not found.
 */
export default function useStepContainerClientId( formClientId ) {
	return useSelect(
		select => {
			if ( ! formClientId ) {
				return null;
			}

			const { getBlocksByName, getBlockParentsByBlockName } = select( blockEditorStore );

			// since you can have multiple forms on a page, we need to check if the formClientId is in the parent form
			const stepContainers = getBlocksByName( 'jetpack/form-step-container' );

			if ( ! stepContainers || stepContainers.length === 0 ) {
				return null;
			}

			const containerId = stepContainers.find( stepContainerId => {
				const parentId = getBlockParentsByBlockName( stepContainerId, [
					'jetpack/contact-form',
				] )[ 0 ];
				return parentId && parentId === formClientId;
			} );

			if ( ! containerId ) {
				return null;
			}
			return containerId;
		},
		[ formClientId ]
	);
}
