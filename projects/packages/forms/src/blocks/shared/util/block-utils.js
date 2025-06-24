import { useSelect } from '@wordpress/data';

/**
 * Determines if the current block selection is within a contact form.
 *
 * @param {Function} select - The data store select function to access the block editor state.
 *
 * @return {boolean} Whether the selection is within a contact form
 */
export const isWithinContactForm = select => {
	const blockEditor = select( 'core/block-editor' );
	if ( ! blockEditor ) {
		return false;
	}

	const selectedBlockClientIds = blockEditor.getSelectedBlockClientIds();
	if ( ! selectedBlockClientIds?.length ) {
		return false;
	}

	return selectedBlockClientIds.some( blockId => {
		const parentBlocks = blockEditor.getBlockParentsByBlockName( blockId, 'jetpack/contact-form' );
		return parentBlocks.length > 0;
	} );
};

/**
 * React hook wrapper around `isWithinContactForm` that re-evaluates whenever the
 * current selection changes.
 *
 * Components should prefer this over calling the util directly so that they
 * remain reactive without manual subscriptions.
 *
 * @return {boolean} Whether the selection is within a contact form
 *
 * Usage:
 */
export const useIsWithinContactForm = () =>
	useSelect( select => isWithinContactForm( select ), [] );
