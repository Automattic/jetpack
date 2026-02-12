import { store as blockEditorStore } from '@wordpress/block-editor';
import { useCommandLoader } from '@wordpress/commands';
import { store as coreStore } from '@wordpress/core-data';
import { useDispatch, useSelect } from '@wordpress/data';
import { store as editorStore } from '@wordpress/editor';
import { useState, useCallback, useRef } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { pencil } from '@wordpress/icons';
import { FORM_POST_TYPE } from '../../shared/util/constants.js';
import FormNameModal from './form-name-modal.tsx';

type FormCommandsProps = {
	clientId: string;
};

// Factory function that creates the command loader hook
const getRenameFormCommandLoader = ( openModalRef: React.RefObject< () => void > ) =>
	function useRenameFormCommandLoader() {
		const { postType } = useSelect( select => {
			const { getCurrentPostType } = select( editorStore );
			return {
				postType: getCurrentPostType(),
			};
		}, [] );

		const commands = [];

		if ( postType === FORM_POST_TYPE ) {
			commands.push( {
				name: 'jetpack-forms/rename-form',
				label: __( 'Rename form', 'jetpack-forms' ),
				icon: pencil,
				callback: ( { close }: { close: () => void } ) => {
					openModalRef.current?.();
					close();
				},
			} );
		}

		return { isLoading: false, commands };
	};

export default function FormCommands( { clientId }: FormCommandsProps ) {
	const [ isRenameModalOpen, setIsRenameModalOpen ] = useState( false );

	const { updateBlockAttributes } = useDispatch( blockEditorStore );

	const { currentPostTitle, metadata } = useSelect(
		select => {
			const { getCurrentPostId } = select( editorStore );
			const { getEditedEntityRecord } = select( coreStore );
			const { getBlockAttributes } = select( blockEditorStore );

			const postId = getCurrentPostId();
			const post = postId ? getEditedEntityRecord( 'postType', FORM_POST_TYPE, postId ) : null;
			const blockAttributes = getBlockAttributes( clientId );

			return {
				currentPostTitle: ( post as { title?: string } )?.title || '',
				metadata: blockAttributes?.metadata || {},
			};
		},
		[ clientId ]
	);

	const handleClose = () => {
		setIsRenameModalOpen( false );
	};

	const handleSave = useCallback(
		( title: string ) => {
			updateBlockAttributes( clientId, {
				metadata: {
					...metadata,
					name: title,
				},
			} );
		},
		[ clientId, metadata, updateBlockAttributes ]
	);

	// Use ref to store the openModal callback so the command loader always has access to latest state
	const openModalRef = useRef( () => {
		setIsRenameModalOpen( true );
	} );

	useCommandLoader( {
		name: 'jetpack-forms/form-commands',
		hook: getRenameFormCommandLoader( openModalRef ),
		context: 'block-selection-edit',
	} );

	return (
		<FormNameModal
			isOpen={ isRenameModalOpen }
			onClose={ handleClose }
			onSave={ handleSave }
			initialTitle={ currentPostTitle }
			modalTitle={ __( 'Rename Form', 'jetpack-forms' ) }
			cancelLabel={ __( 'Cancel', 'jetpack-forms' ) }
			submitLabel={ __( 'Save', 'jetpack-forms' ) }
		/>
	);
}
