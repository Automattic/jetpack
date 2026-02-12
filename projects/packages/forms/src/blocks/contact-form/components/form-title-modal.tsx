import { Button, Modal, TextControl } from '@wordpress/components';
import { store as coreStore } from '@wordpress/core-data';
import { useDispatch, useSelect } from '@wordpress/data';
import { store as editorStore } from '@wordpress/editor';
import { useState, useCallback, useEffect } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { FORM_POST_TYPE } from '../../shared/util/constants.js';

type FormTitleModalProps = {
	hasInnerBlocks: boolean;
};

export default function FormTitleModal( { hasInnerBlocks }: FormTitleModalProps ) {
	const [ isOpen, setIsOpen ] = useState( false );
	const [ hasShown, setHasShown ] = useState( false );
	const [ title, setTitle ] = useState( '' );
	const [ isSaving, setIsSaving ] = useState( false );

	const { editEntityRecord, saveEditedEntityRecord } = useDispatch( coreStore );

	const { currentPostId, currentPostTitle } = useSelect( select => {
		const { getCurrentPostId } = select( editorStore );
		const { getEditedEntityRecord } = select( coreStore );

		const postId = getCurrentPostId();
		const post = postId ? getEditedEntityRecord( 'postType', FORM_POST_TYPE, postId ) : null;

		return {
			currentPostId: postId,
			currentPostTitle: ( post as { title?: string } )?.title || '',
		};
	}, [] );

	const isNewForm =
		! currentPostTitle ||
		currentPostTitle === __( 'Untitled Form', 'jetpack-forms' ) ||
		currentPostTitle === 'Untitled Form';

	// Show modal on first render if this is a new placeholder form in the form editor
	useEffect( () => {
		if ( ! hasInnerBlocks && isNewForm && ! hasShown ) {
			setIsOpen( true );
			setHasShown( true );
		}
	}, [ hasInnerBlocks, isNewForm, hasShown ] );

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

	const handleKeyDown = useCallback(
		( event: React.KeyboardEvent ) => {
			if ( event.key === 'Enter' ) {
				event.preventDefault();
				handleConfirm();
			}
		},
		[ handleConfirm ]
	);

	if ( ! isOpen ) {
		return null;
	}

	return (
		<Modal
			title={ __( 'Create Form', 'jetpack-forms' ) }
			onRequestClose={ handleClose }
			size="medium"
		>
			<form onSubmit={ onSubmitForm }>
				<TextControl
					label={ __( 'Name', 'jetpack-forms' ) }
					value={ title }
					onChange={ setTitle }
					onKeyDown={ handleKeyDown }
					__next40pxDefaultSize
				/>
				<div
					style={ {
						display: 'flex',
						justifyContent: 'flex-end',
						gap: '8px',
						marginTop: '16px',
					} }
				>
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
}
