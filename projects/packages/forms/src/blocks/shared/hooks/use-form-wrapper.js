import { store as blockEditorStore } from '@wordpress/block-editor';
import { createBlock } from '@wordpress/blocks';
import { store as coreStore } from '@wordpress/core-data';
import { resolveSelect, useDispatch, useSelect } from '@wordpress/data';
import { store as editorStore } from '@wordpress/editor';
import { useEffect } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import useConfigValue from '../../../hooks/use-config-value.ts';
import { createSyncedForm } from '../../contact-form/util/create-synced-form.ts';
import { FORM_BLOCK_NAME, FORM_POST_TYPE } from '../util/constants.js';

export default function useFormWrapper( { attributes, clientId, name } ) {
	const { replaceBlock, updateBlockAttributes, __unstableMarkNextChangeAsNotPersistent } =
		useDispatch( blockEditorStore );
	const { getBlock, getBlocks } = useSelect( blockEditorStore );

	// Feature flag for central form management
	const isCentralFormManagementEnabled = useConfigValue( 'isCentralFormManagementEnabled' );

	const { parentForms, postTitle, currentPostId } = useSelect(
		select => {
			return {
				parentForms: select( blockEditorStore ).getBlockParentsByBlockName(
					clientId,
					FORM_BLOCK_NAME
				),
				postTitle: select( editorStore ).getEditedPostAttribute( 'title' ) || 'Untitled',
				currentPostId: select( editorStore ).getEditedPostAttribute( 'id' ),
			};
		},
		[ clientId ]
	);

	useEffect( () => {
		if ( ! parentForms?.length ) {
			// Create the form block structure
			const fieldBlock = createBlock( name, attributes, getBlocks( clientId ) );
			const submitButton = createBlock( 'core/button', {
				text: __( 'Submit', 'jetpack-forms' ),
				type: 'submit',
				tagName: 'button',
			} );
			const formBlock = createBlock( FORM_BLOCK_NAME, {}, [ fieldBlock, submitButton ] );

			// Phase 1: Replace field with form (immediate visual feedback)
			// As this is an automated update, ensure it doesn't end up in the undo stack
			// by calling `__unstableMarkNextChangeAsNotPersistent`.
			__unstableMarkNextChangeAsNotPersistent();
			replaceBlock( clientId, formBlock );

			// Phase 2: Convert to synced form (async) - only if feature flag is enabled
			if ( isCentralFormManagementEnabled ) {
				const convertToSynced = async () => {
					try {
						const formId = await createSyncedForm(
							{
								attributes: {},
								innerBlocks: [ fieldBlock, submitButton ],
							},
							postTitle,
							currentPostId
						);

						// Preload the entity record into the cache BEFORE setting ref.
						// This ensures the form component won't show a loading skeleton
						// because the data will already be available in the store.
						await resolveSelect( coreStore ).getEntityRecord( 'postType', FORM_POST_TYPE, formId );

						// Verify the block still exists before updating its attributes
						// (user might have deleted it or undone the operation)
						if ( ! getBlock( formBlock.clientId ) ) {
							return;
						}

						// Now set the ref - the form data is already cached, so no loading state
						__unstableMarkNextChangeAsNotPersistent();
						updateBlockAttributes( formBlock.clientId, { ref: formId } );
					} catch {
						// If synced form creation fails, keep as inline form (graceful degradation)
					}
				};

				convertToSynced();
			}
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [] );
}
