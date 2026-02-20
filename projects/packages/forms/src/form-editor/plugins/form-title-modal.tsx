/**
 * Form Title Modal Plugin
 *
 * Shows a modal to name a new form when first creating it in the form editor.
 * Only displays for new/untitled forms that don't have any content yet.
 */

import { store as coreStore } from '@wordpress/core-data';
import { useDispatch, useSelect } from '@wordpress/data';
import { store as editorStore } from '@wordpress/editor';
import { useState, useCallback, useEffect, useRef } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { store as noticesStore } from '@wordpress/notices';
import { FORM_POST_TYPE } from '../../blocks/shared/util/constants.js';
import { FormNameModal } from '../../dashboard/components/form-name-modal';

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
	const retryTitleRef = useRef< string >( '' );

	const { editEntityRecord, saveEditedEntityRecord } = useDispatch( coreStore );
	const { createSuccessNotice, createErrorNotice } = useDispatch( noticesStore );

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

	const handleSave = useCallback(
		async ( newTitle: string ) => {
			if ( ! currentPostId ) {
				return;
			}

			try {
				await editEntityRecord( 'postType', FORM_POST_TYPE, currentPostId, {
					title: newTitle,
				} );
				await saveEditedEntityRecord( 'postType', FORM_POST_TYPE, currentPostId, {
					throwOnError: true,
				} );

				createSuccessNotice( __( 'Form created.', 'jetpack-forms' ), {
					type: 'snackbar',
				} );
				retryTitleRef.current = '';
			} catch {
				createErrorNotice( __( 'Failed to create form.', 'jetpack-forms' ), {
					type: 'snackbar',
					actions: [
						{
							label: __( 'Retry', 'jetpack-forms' ),
							onClick: () => {
								setIsOpen( true );
							},
						},
					],
				} );
				retryTitleRef.current = newTitle;
				setIsOpen( false );
			}
		},
		[
			currentPostId,
			editEntityRecord,
			saveEditedEntityRecord,
			createSuccessNotice,
			createErrorNotice,
		]
	);

	// Show modal on first render if this is a new placeholder form in the form editor
	useEffect( () => {
		if ( isFormEditor && ! hasInnerBlocks && isNewForm && ! hasShown ) {
			setIsOpen( true );
			setHasShown( true );
		}
	}, [ isFormEditor, hasInnerBlocks, isNewForm, hasShown ] );

	// Don't render anything if not in the form editor
	if ( ! isFormEditor ) {
		return null;
	}

	return (
		<FormNameModal
			isOpen={ isOpen }
			onClose={ handleClose }
			onSave={ handleSave }
			title={ __( 'Create form', 'jetpack-forms' ) }
			initialValue={ retryTitleRef.current }
			primaryButtonLabel={ __( 'Create', 'jetpack-forms' ) }
			secondaryButtonLabel={ __( 'Skip', 'jetpack-forms' ) }
			placeholder={ __( 'Enter form name', 'jetpack-forms' ) }
		/>
	);
};
