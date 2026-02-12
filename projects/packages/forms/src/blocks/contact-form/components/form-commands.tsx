import { useCommandLoader } from '@wordpress/commands';
import { Button, Modal, TextControl } from '@wordpress/components';
import { store as coreStore } from '@wordpress/core-data';
import { useDispatch, useSelect } from '@wordpress/data';
import { store as editorStore } from '@wordpress/editor';
import { useState, useCallback, useMemo, useRef } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { pencil } from '@wordpress/icons';
import { FORM_POST_TYPE } from '../../shared/util/constants.js';

export default function FormCommands() {
	const [ isRenameModalOpen, setIsRenameModalOpen ] = useState( false );
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

	// Use ref to store the callback so the command loader always has access to latest state
	const openRenameModalRef = useRef< () => void >( () => {} );
	openRenameModalRef.current = () => {
		setTitle( currentPostTitle );
		setIsRenameModalOpen( true );
	};

	const handleClose = useCallback( () => {
		setIsRenameModalOpen( false );
		setTitle( '' );
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
		setIsRenameModalOpen( false );
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

	// Command loader hook - defined as a proper hook function
	function useRenameFormCommandLoader() {
		const { isJetpackFormEditor } = useSelect( select => {
			const { getCurrentPostType } = select( editorStore );
			return {
				isJetpackFormEditor: getCurrentPostType() === FORM_POST_TYPE,
			};
		}, [] );

		const commands = useMemo( () => {
			if ( ! isJetpackFormEditor ) {
				return [];
			}

			return [
				{
					name: 'jetpack-forms/rename-form',
					label: __( 'Rename form', 'jetpack-forms' ),
					icon: pencil,
					callback: ( { close }: { close: () => void } ) => {
						openRenameModalRef.current();
						close();
					},
				},
			];
		}, [ isJetpackFormEditor ] );

		return {
			commands,
			isLoading: false,
		};
	}

	useCommandLoader( {
		name: 'jetpack-forms/form-commands',
		hook: useRenameFormCommandLoader,
	} );

	if ( ! isRenameModalOpen ) {
		return null;
	}

	return (
		<Modal
			title={ __( 'Rename Form', 'jetpack-forms' ) }
			onRequestClose={ handleClose }
			size="medium"
		>
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
						{ __( 'Cancel', 'jetpack-forms' ) }
					</Button>
					<Button aria-disabled={ isSaving } isBusy={ isSaving } variant="primary" type="submit">
						{ __( 'Save', 'jetpack-forms' ) }
					</Button>
				</div>
			</form>
		</Modal>
	);
}
