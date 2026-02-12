import { store as blockEditorStore } from '@wordpress/block-editor';
import { store as coreStore } from '@wordpress/core-data';
import { useDispatch, useSelect } from '@wordpress/data';
import { store as editorStore } from '@wordpress/editor';
import { useCallback } from '@wordpress/element';
import { FORM_POST_TYPE } from '../../shared/util/constants.js';

/**
 * Hook that provides form metadata and utilities for updating it.
 * Extracts shared logic from FormCommands and FormTitleModal.
 *
 * @param clientId - The block's client ID
 * @return Object containing currentPostTitle, metadata, and updateMetadataName function
 */
export function useFormMetadata( clientId: string ) {
	const { updateBlockAttributes } = useDispatch( blockEditorStore );

	const { currentPostTitle, metadata } = useSelect(
		select => {
			const { getCurrentPostId } = select( editorStore );
			const { getEditedEntityRecord } = select( coreStore );
			const { getBlockAttributes } = select( blockEditorStore );

			const postId = getCurrentPostId();
			const post = postId ? getEditedEntityRecord( 'postType', FORM_POST_TYPE, postId ) : null;
			const blockAttributes = getBlockAttributes( clientId );

			return {
				currentPostTitle: ( post as { title?: string } )?.title || '',
				metadata: blockAttributes?.metadata || {},
			};
		},
		[ clientId ]
	);

	const updateMetadataName = useCallback(
		( name: string ) => {
			updateBlockAttributes( clientId, {
				metadata: {
					...metadata,
					name,
				},
			} );
		},
		[ clientId, metadata, updateBlockAttributes ]
	);

	return { currentPostTitle, metadata, updateMetadataName };
}
