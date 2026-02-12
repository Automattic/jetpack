import { useCommandLoader } from '@wordpress/commands';
import { store as coreStore } from '@wordpress/core-data';
import { useSelect } from '@wordpress/data';
import { store as editorStore } from '@wordpress/editor';
import { useState, useMemo, useRef } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { pencil } from '@wordpress/icons';
import { FORM_POST_TYPE } from '../../shared/util/constants.js';
import FormNameModal from './form-name-modal.tsx';

export default function FormCommands() {
	const [ isRenameModalOpen, setIsRenameModalOpen ] = useState( false );

	const { currentPostTitle } = useSelect( select => {
		const { getCurrentPostId } = select( editorStore );
		const { getEditedEntityRecord } = select( coreStore );

		const postId = getCurrentPostId();
		const post = postId ? getEditedEntityRecord( 'postType', FORM_POST_TYPE, postId ) : null;

		return {
			currentPostTitle: ( post as { title?: string } )?.title || '',
		};
	}, [] );

	// Use ref to store the callback so the command loader always has access to latest state
	const openRenameModalRef = useRef< () => void >( () => {} );
	openRenameModalRef.current = () => {
		setIsRenameModalOpen( true );
	};

	const handleClose = () => {
		setIsRenameModalOpen( false );
	};

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

	return (
		<FormNameModal
			isOpen={ isRenameModalOpen }
			onClose={ handleClose }
			initialTitle={ currentPostTitle }
			modalTitle={ __( 'Rename Form', 'jetpack-forms' ) }
			cancelLabel={ __( 'Cancel', 'jetpack-forms' ) }
			submitLabel={ __( 'Save', 'jetpack-forms' ) }
		/>
	);
}
