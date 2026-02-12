import { Button, Modal, TextControl } from '@wordpress/components';
import { store as coreStore } from '@wordpress/core-data';
import { useDispatch, useSelect } from '@wordpress/data';
import { store as editorStore } from '@wordpress/editor';
import { useState, useCallback, useEffect } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { FORM_POST_TYPE } from '../../shared/util/constants.js';

type FormNameModalProps = {
	isOpen: boolean;
	onClose: () => void;
	initialTitle?: string;
	modalTitle: string;
	cancelLabel: string;
	submitLabel: string;
};

export default function FormNameModal( {
	isOpen,
	onClose,
	initialTitle = '',
	modalTitle,
	cancelLabel,
	submitLabel,
}: FormNameModalProps ) {
	const [ title, setTitle ] = useState( initialTitle );
	const [ isSaving, setIsSaving ] = useState( false );

	const { editEntityRecord, saveEditedEntityRecord } = useDispatch( coreStore );

	const { currentPostId } = useSelect( select => {
		const { getCurrentPostId } = select( editorStore );
		return {
			currentPostId: getCurrentPostId(),
		};
	}, [] );

	// Reset title when modal opens with new initialTitle
	useEffect( () => {
		if ( isOpen ) {
			setTitle( initialTitle );
		}
	}, [ isOpen, initialTitle ] );

	const handleClose = useCallback( () => {
		setTitle( '' );
		onClose();
	}, [ onClose ] );

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
		onClose();
	}, [ title, currentPostId, editEntityRecord, saveEditedEntityRecord, onClose ] );

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

	if ( ! isOpen ) {
		return null;
	}

	return (
		<Modal title={ modalTitle } onRequestClose={ handleClose } size="medium">
			<form onSubmit={ onSubmitForm }>
				<TextControl
					label={ __( 'Name', 'jetpack-forms' ) }
					value={ title }
					onChange={ setTitle }
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
						{ cancelLabel }
					</Button>
					<Button aria-disabled={ isSaving } isBusy={ isSaving } variant="primary" type="submit">
						{ submitLabel }
					</Button>
				</div>
			</form>
		</Modal>
	);
}
