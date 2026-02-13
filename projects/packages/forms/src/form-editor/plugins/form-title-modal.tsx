/**
 * Form Title Modal Plugin
 *
 * Shows a modal to name a new form when first creating it in the form editor.
 * Only displays for new/untitled forms that don't have any content yet.
 */

import { Button, Modal, TextControl } from '@wordpress/components';
import { store as coreStore } from '@wordpress/core-data';
import { useDispatch, useSelect } from '@wordpress/data';
import { store as editorStore } from '@wordpress/editor';
import { useState, useCallback, useEffect } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { FORM_POST_TYPE } from '../../blocks/shared/util/constants.js';

/**
 * Form Title Modal component.
 *
 * Displays a modal prompting the user to name their form when creating a new one.
 * Only shows for jetpack_form post type when the form is untitled and empty.
 *
 * @return The modal component or null.
 */
export const FormTitleModal = () => {
	const [ isOpen, setIsOpen ] = useState( false );
	const [ hasShown, setHasShown ] = useState( false );
	const [ title, setTitle ] = useState( '' );
	const [ isSaving, setIsSaving ] = useState( false );

	const { editEntityRecord, saveEditedEntityRecord } = useDispatch( coreStore );

	const { currentPostId, currentPostTitle, postType, hasInnerBlocks } = useSelect( select => {
		const editor = select( editorStore ) as {
			getCurrentPostId: () => number;
			getCurrentPostType: () => string;
		};
		const core = select( coreStore ) as {
			getEditedEntityRecord: (
				kind: string,
				name: string,
				key: number
			) => { title?: string } | null;
		};
		const blockEditor = select( 'core/block-editor' ) as {
			getBlocks: () => Array< {
				name: string;
				innerBlocks: unknown[];
			} >;
		};

		const postId = editor.getCurrentPostId();
		const post = postId ? core.getEditedEntityRecord( 'postType', FORM_POST_TYPE, postId ) : null;

		// Check if the form block has any inner blocks
		const rootBlocks = blockEditor.getBlocks();
		const formBlock = rootBlocks.find( block => block.name === 'jetpack/contact-form' );
		const formHasInnerBlocks = formBlock?.innerBlocks?.length > 0;

		return {
			currentPostId: postId,
			currentPostTitle: post?.title || '',
			postType: editor.getCurrentPostType(),
			hasInnerBlocks: formHasInnerBlocks,
		};
	}, [] );

	const isFormEditor = postType === FORM_POST_TYPE;

	const isNewForm =
		! currentPostTitle || currentPostTitle === __( 'Untitled Form', 'jetpack-forms' );

	const handleClose = useCallback( () => {
		setIsOpen( false );
	}, [] );

	const handleConfirm = useCallback( async () => {
		setIsSaving( true );
		const newTitle = title.trim() || __( 'Untitled Form', 'jetpack-forms' );

		if ( currentPostId ) {
			await editEntityRecord( 'postType', FORM_POST_TYPE, currentPostId, {
				title: newTitle,
			} );
			await saveEditedEntityRecord( 'postType', FORM_POST_TYPE, currentPostId );
		}
		setIsSaving( false );
		setIsOpen( false );
	}, [ title, currentPostId, editEntityRecord, saveEditedEntityRecord ] );

	const onSubmitForm = useCallback(
		( event: React.FormEvent ) => {
			event.preventDefault();
			if ( isSaving ) {
				return;
			}
			handleConfirm();
		},
		[ handleConfirm, isSaving ]
	);

	// Show modal on first render if this is a new placeholder form in the form editor
	useEffect( () => {
		if ( isFormEditor && ! hasInnerBlocks && isNewForm && ! hasShown ) {
			setIsOpen( true );
			setHasShown( true );
		}
	}, [ isFormEditor, hasInnerBlocks, isNewForm, hasShown ] );

	// Don't render anything if not in the form editor or modal is closed
	if ( ! isFormEditor || ! isOpen ) {
		return null;
	}

	return (
		<Modal
			title={ __( 'Create form', 'jetpack-forms' ) }
			onRequestClose={ handleClose }
			size="medium"
		>
			<form onSubmit={ onSubmitForm }>
				<TextControl
					label={ __( 'Name', 'jetpack-forms' ) }
					value={ title }
					onChange={ setTitle }
					__next40pxDefaultSize
					placeholder={ __( 'Enter form name', 'jetpack-forms' ) }
					disabled={ isSaving }
				/>
				<div className="jetpack-forms-title-modal__buttons">
					<Button variant="tertiary" onClick={ handleClose }>
						{ __( 'Skip', 'jetpack-forms' ) }
					</Button>
					<Button aria-disabled={ isSaving } isBusy={ isSaving } variant="primary" type="submit">
						{ __( 'Create', 'jetpack-forms' ) }
					</Button>
				</div>
			</form>
		</Modal>
	);
};
