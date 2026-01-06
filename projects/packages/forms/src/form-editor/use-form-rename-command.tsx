/**
 * Custom hook to register a command for renaming jetpack_form posts
 * Similar to navigation block's rename functionality
 */

import { store as blockEditorStore } from '@wordpress/block-editor';
import { useCommandLoader } from '@wordpress/commands';
import { TextControl, Modal, Button } from '@wordpress/components';
import { store as coreStore } from '@wordpress/core-data';
import { useSelect, useDispatch } from '@wordpress/data';
import { store as editorStore } from '@wordpress/editor';
import { useState, useCallback } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { pencil } from '@wordpress/icons';
import { FORM_POST_TYPE } from '../blocks/shared/util/constants.js';

/**
 * Hook to register the rename command for jetpack_form posts
 *
 * @return {JSX.Element|null} The rename modal component or null
 */
export function useFormRenameCommand() {
	const [ isModalOpen, setIsModalOpen ] = useState( false );
	const [ newTitle, setNewTitle ] = useState( '' );

	const { isFormBlockSelected, formPostId, formTitle, currentPostType } = useSelect( select => {
		const { getSelectedBlock } = select( blockEditorStore );
		const { getCurrentPostType, getEditedPostAttribute, getCurrentPostId } = select( editorStore );
		const { getEditedEntityRecord } = select( coreStore );

		const selectedBlock = getSelectedBlock();
		const isContactFormBlock = selectedBlock?.name === 'jetpack/contact-form';
		const currentType = getCurrentPostType();

		// Get form post ID and title
		let postId = null;
		let title = '';

		if ( isContactFormBlock ) {
			// If editing a jetpack_form post directly
			if ( currentType === FORM_POST_TYPE ) {
				postId = getCurrentPostId();
				title = getEditedPostAttribute( 'title' ) || '';
			}
			// If the form block has a ref attribute (synced form)
			else if ( selectedBlock?.attributes?.ref ) {
				postId = selectedBlock.attributes.ref;
				const formPost = getEditedEntityRecord( 'postType', FORM_POST_TYPE, postId );
				title = formPost?.title || '';
			}
		}

		return {
			isFormBlockSelected: isContactFormBlock && postId !== null,
			formPostId: postId,
			formTitle: title,
			currentPostType: currentType,
		};
	}, [] );

	const { editPost } = useDispatch( editorStore );
	const { editEntityRecord } = useDispatch( coreStore );

	const openModal = useCallback( () => {
		setNewTitle( formTitle );
		setIsModalOpen( true );
	}, [ formTitle ] );

	const closeModal = useCallback( () => {
		setIsModalOpen( false );
		setNewTitle( '' );
	}, [] );

	const handleRename = useCallback( () => {
		const trimmedNewTitle = newTitle.trim();
		const trimmedFormTitle = ( formTitle || '' ).trim();
		if ( trimmedNewTitle && trimmedNewTitle !== trimmedFormTitle && formPostId ) {
			// If editing jetpack_form post directly
			if ( currentPostType === FORM_POST_TYPE ) {
				editPost( { title: newTitle } );
			}
			// If editing a synced form (has ref attribute)
			else {
				editEntityRecord( 'postType', FORM_POST_TYPE, formPostId, { title: newTitle } );
			}
		}
		closeModal();
	}, [ newTitle, formTitle, formPostId, currentPostType, editPost, editEntityRecord, closeModal ] );

	const handleKeyDown = useCallback(
		( event: React.KeyboardEvent ) => {
			if ( event.key === 'Enter' ) {
				event.preventDefault();
				handleRename();
			}
		},
		[ handleRename ]
	);

	// Use command loader to register the rename command
	useCommandLoader( {
		name: 'jetpack-forms/rename-form-loader',
		context: 'block-selection-edit',
		hook: useCallback( () => {
			if ( ! isFormBlockSelected ) {
				return { commands: [], isLoading: false };
			}

			return {
				commands: [
					{
						name: 'jetpack-forms/rename-form',
						label: __( 'Rename form', 'jetpack-forms' ),
						icon: pencil,
						callback: ( { close } ) => {
							openModal();
							close();
						},
					},
				],
				isLoading: false,
			};
		}, [ isFormBlockSelected, openModal ] ),
	} );

	// Render the modal
	if ( ! isFormBlockSelected || ! isModalOpen ) {
		return null;
	}

	return (
		<Modal
			title={ __( 'Rename form', 'jetpack-forms' ) }
			onRequestClose={ closeModal }
			className="jetpack-forms-rename-modal"
		>
			<TextControl
				label={ __( 'Name', 'jetpack-forms' ) }
				value={ newTitle }
				onChange={ setNewTitle }
				placeholder={ __( 'Enter form name', 'jetpack-forms' ) }
				onKeyDown={ handleKeyDown }
				// eslint-disable-next-line jsx-a11y/no-autofocus
				autoFocus
			/>
			<div className="jetpack-forms-rename-modal__actions">
				<Button variant="tertiary" onClick={ closeModal }>
					{ __( 'Cancel', 'jetpack-forms' ) }
				</Button>
				<Button variant="primary" onClick={ handleRename } disabled={ ! newTitle.trim() }>
					{ __( 'Rename', 'jetpack-forms' ) }
				</Button>
			</div>
		</Modal>
	);
}
