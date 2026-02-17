import { store as blockEditorStore } from '@wordpress/block-editor';
import { createBlock } from '@wordpress/blocks';
import { store as coreStore } from '@wordpress/core-data';
import { resolveSelect, useDispatch, useSelect } from '@wordpress/data';
import { store as editorStore } from '@wordpress/editor';
import { useEffect, useRef } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import useConfigValue from '../../../hooks/use-config-value.ts';
import { createSyncedForm } from '../../contact-form/util/create-synced-form.ts';
import { FORM_BLOCK_NAME, FORM_POST_TYPE } from '../util/constants.js';

/**
 * Creates the form block structure with a field and submit button.
 *
 * @param {string} fieldBlockName   - The name of the field block.
 * @param {object} fieldAttributes  - The attributes for the field block.
 * @param {Array}  fieldInnerBlocks - The inner blocks for the field block.
 * @return {object} Object containing formBlock, fieldBlock, and submitButton.
 */
export function createFormBlockStructure( fieldBlockName, fieldAttributes, fieldInnerBlocks = [] ) {
	const fieldBlock = createBlock( fieldBlockName, fieldAttributes, fieldInnerBlocks );
	const submitButton = createBlock( 'core/button', {
		text: __( 'Submit', 'jetpack-forms' ),
		type: 'submit',
		tagName: 'button',
	} );
	const formBlock = createBlock( FORM_BLOCK_NAME, {}, [ fieldBlock, submitButton ] );

	return { formBlock, fieldBlock, submitButton };
}

/**
 * Converts a form block to a synced form by creating a jetpack_form post.
 *
 * @param {object}   formBlock                     - The form block to convert.
 * @param {object}   fieldBlock                    - The field block inside the form.
 * @param {object}   submitButton                  - The submit button block.
 * @param {string}   postTitle                     - The title of the current post.
 * @param {number}   currentPostId                 - The ID of the current post.
 * @param {Function} updateBlockAttributes         - Function to update block attributes.
 * @param {Function} markNextChangeAsNotPersistent - Function to mark changes as not persistent.
 */
export async function convertFormToSynced(
	formBlock,
	fieldBlock,
	submitButton,
	postTitle,
	currentPostId,
	updateBlockAttributes,
	markNextChangeAsNotPersistent
) {
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

	// Now set the ref - the form data is already cached, so no loading state
	markNextChangeAsNotPersistent();
	updateBlockAttributes( formBlock.clientId, { ref: formId } );
}

/**
 * Determines if a field block should be wrapped in a form.
 *
 * @param {string} currentPostType - The current post type being edited.
 * @param {Array}  parentForms     - Array of parent form block IDs.
 * @return {boolean} Whether the field should be wrapped.
 */
export function shouldWrapFieldInForm( currentPostType, parentForms ) {
	// Don't wrap fields when editing a jetpack_form post type directly
	if ( currentPostType === FORM_POST_TYPE ) {
		return false;
	}

	// Wrap if there's no parent form
	return ! parentForms?.length;
}

/**
 *
 * Custom hook to wrap a field block in a form block when conditions are met.
 *
 * @param {*}      param0            - The parameters object.
 * @param {object} param0.attributes - The block attributes.
 * @param {string} param0.clientId   - The block client ID.
 * @param {string} param0.name       - The block name.
 */
export default function useFormWrapper( { attributes, clientId, name } ) {
	const { replaceBlock, updateBlockAttributes, __unstableMarkNextChangeAsNotPersistent } =
		useDispatch( blockEditorStore );
	const { getBlocks } = useSelect( blockEditorStore );

	// Feature flag for central form management
	const isCentralFormManagementEnabled = useConfigValue( 'isCentralFormManagementEnabled' );

	const { parentForms, postTitle, currentPostId, currentPostType, wasBlockJustInserted } =
		useSelect(
			select => {
				return {
					parentForms: select( blockEditorStore ).getBlockParentsByBlockName(
						clientId,
						FORM_BLOCK_NAME
					),
					postTitle: select( editorStore ).getEditedPostAttribute( 'title' ) || 'Untitled',
					currentPostId: select( editorStore ).getEditedPostAttribute( 'id' ),
					currentPostType: select( editorStore ).getCurrentPostType(),
					wasBlockJustInserted: select( blockEditorStore ).wasBlockJustInserted( clientId ),
				};
			},
			[ clientId ]
		);

	// Guard against StrictMode double-invocation and re-renders
	const hasAttemptedWrap = useRef( false );

	useEffect( () => {
		// Prevent double execution from React StrictMode
		if ( hasAttemptedWrap.current ) {
			return;
		}

		if ( ! shouldWrapFieldInForm( currentPostType, parentForms ) ) {
			return;
		}

		hasAttemptedWrap.current = true;

		const { formBlock, fieldBlock, submitButton } = createFormBlockStructure(
			name,
			attributes,
			getBlocks( clientId )
		);

		// Replace field with form (immediate visual feedback)
		// Mark as not persistent so it doesn't end up in the undo stack
		__unstableMarkNextChangeAsNotPersistent();
		replaceBlock( clientId, formBlock );

		// Convert to synced form (async) - only if conditions are met
		if ( isCentralFormManagementEnabled && wasBlockJustInserted ) {
			convertFormToSynced(
				formBlock,
				fieldBlock,
				submitButton,
				postTitle,
				currentPostId,
				updateBlockAttributes,
				__unstableMarkNextChangeAsNotPersistent
			).catch( () => {
				// If synced form creation fails, keep as inline form (graceful degradation)
			} );
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [] );
}
