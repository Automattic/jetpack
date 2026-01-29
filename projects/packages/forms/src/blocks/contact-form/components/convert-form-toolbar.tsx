/**
 * Convert Form Toolbar Component
 * Provides toolbar buttons to convert forms to synced mode and edit synced forms
 */

import { store as blockEditorStore } from '@wordpress/block-editor';
import { ToolbarGroup, ToolbarButton } from '@wordpress/components';
import { useSelect, useDispatch } from '@wordpress/data';
import { store as editorStore } from '@wordpress/editor';
import { __ } from '@wordpress/i18n';
import { store as noticesStore } from '@wordpress/notices';
import { addQueryArgs } from '@wordpress/url';
import { FORM_POST_TYPE } from '../../shared/util/constants.js';
import { createSyncedForm } from '../util/create-synced-form.ts';

const FORM_CONVERSION_LOCK = 'jetpack-form-conversion';

interface ConvertFormToolbarProps {
	clientId: string;
	attributes: Record< string, unknown >;
}

export function ConvertFormToolbar( { clientId, attributes }: ConvertFormToolbarProps ) {
	const { postTitle, currentPostId, isLocked } = useSelect( select => {
		const editedPost = select( editorStore ).getEditedPostAttribute( 'title' );
		const editedPostId = select( editorStore ).getEditedPostAttribute( 'id' );
		const savingLocked = select( editorStore ).isPostSavingLocked();
		return {
			postTitle: editedPost || 'Untitled',
			currentPostId: editedPostId,
			isLocked: savingLocked,
		};
	}, [] );

	const { onNavigateToEntityRecord, isSiteEditor } = useSelect( select => {
		const { getSettings } = select( blockEditorStore );
		return {
			onNavigateToEntityRecord: getSettings().onNavigateToEntityRecord,
			isSiteEditor: !! select( 'core/edit-site' ),
		};
	}, [] );

	// Get block data
	const block = useSelect(
		select => select( blockEditorStore ).getBlock( clientId ),
		[ clientId ]
	);

	// Get functions to manipulate blocks
	const { replaceInnerBlocks, updateBlockAttributes } = useDispatch( blockEditorStore );
	const { lockPostSaving, unlockPostSaving } = useDispatch( editorStore );
	const { createErrorNotice } = useDispatch( noticesStore );

	const hasRef = !! attributes.ref;

	/**
	 * Open the form editor by navigating directly.
	 * @param formId - The ID of the form to edit.
	 */
	const openFormEditor = ( formId: number ) => {
		const editUrl = addQueryArgs( 'post.php', { post: formId, action: 'edit' } );
		window.location.href = editUrl;
	};

	/**
	 * Convert inline form to synced form
	 */
	const convertToSynced = async () => {
		if ( ! block || isLocked ) {
			return;
		}

		lockPostSaving( FORM_CONVERSION_LOCK );

		try {
			// Remove ref from attributes if it exists (shouldn't, but safety check)
			// eslint-disable-next-line @typescript-eslint/no-unused-vars
			const { ref, ...cleanAttributes } = attributes;

			// Create the synced form post with all attributes and innerBlocks
			const formId = await createSyncedForm(
				{
					attributes: cleanAttributes,
					innerBlocks: block.innerBlocks || [],
				},
				postTitle,
				currentPostId
			);

			// Clear innerBlocks first
			replaceInnerBlocks( clientId, [], false );

			// Get all current attribute keys
			const attributeKeys = Object.keys( attributes );
			const clearedAttributes: Record< string, unknown > = {};

			// Set all attributes to undefined to clear them
			attributeKeys.forEach( key => {
				clearedAttributes[ key ] = undefined;
			} );

			// Then set only the ref
			clearedAttributes.ref = formId;

			// Update attributes using updateBlockAttributes which properly clears them
			updateBlockAttributes( clientId, clearedAttributes );

			if ( isSiteEditor ) {
				openFormEditor( formId );
			} else if ( onNavigateToEntityRecord ) {
				onNavigateToEntityRecord( {
					postId: formId,
					postType: FORM_POST_TYPE,
				} );
			}
		} catch {
			createErrorNotice( __( 'Failed to create a form. Please try again.', 'jetpack-forms' ), {
				type: 'snackbar',
				isDismissible: true,
			} );
		} finally {
			unlockPostSaving( FORM_CONVERSION_LOCK );
		}
	};

	/**
	 * Navigate to edit the synced form post
	 */
	const handleEditOriginal = () => {
		if ( ! attributes.ref ) {
			return;
		}

		if ( isSiteEditor ) {
			openFormEditor( attributes.ref as number );
			return;
		}

		if ( onNavigateToEntityRecord ) {
			onNavigateToEntityRecord( {
				postId: attributes.ref as number,
				postType: FORM_POST_TYPE,
			} );
		}
	};

	const showEditButton = hasRef && ( isSiteEditor || onNavigateToEntityRecord );
	const showConvertButton = ! hasRef;

	return (
		<ToolbarGroup>
			{ showEditButton && (
				<ToolbarButton onClick={ handleEditOriginal }>
					{ __( 'Edit Form', 'jetpack-forms' ) }
				</ToolbarButton>
			) }
			{ showConvertButton && (
				<ToolbarButton onClick={ convertToSynced } disabled={ isLocked }>
					{ __( 'Edit Form', 'jetpack-forms' ) }
				</ToolbarButton>
			) }
		</ToolbarGroup>
	);
}
