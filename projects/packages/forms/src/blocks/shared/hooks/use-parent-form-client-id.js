import { store as blockEditorStore } from '@wordpress/block-editor';
import { useSelect } from '@wordpress/data';

/**
 * Custom hook to find the parent 'jetpack/contact-form' block's clientId
 * for a given child block.
 *
 * @param {string} clientId - The client ID of the child block.
 * @return {string|null} The client ID of the parent form, or null if not found.
 */
const useParentFormClientId = clientId => {
	return useSelect(
		select => {
			if ( ! clientId ) {
				return null;
			}

			const { getBlockParentsByBlockName } = select( blockEditorStore );
			// Find the top-level contact form ancestor
			const parentFormIds = getBlockParentsByBlockName( clientId, [ 'jetpack/contact-form' ] );

			// Return the first parent form ID or null if not found
			return parentFormIds?.[ 0 ] || null;
		},
		[ clientId ]
	);
};

export default useParentFormClientId;
