import { useCommandLoader } from '@wordpress/commands';
import { useSelect } from '@wordpress/data';
import { store as editorStore } from '@wordpress/editor';
import { useState, useCallback, useRef, useMemo } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { pencil } from '@wordpress/icons';
import { FORM_POST_TYPE } from '../../shared/util/constants.js';
import { useFormMetadata } from '../hooks/use-form-metadata.ts';
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

	const { currentPostTitle, updateMetadataName } = useFormMetadata( clientId );

	const handleClose = useCallback( () => {
		setIsRenameModalOpen( false );
	}, [] );

	const handleSave = useCallback(
		( title: string ) => {
			updateMetadataName( title );
		},
		[ updateMetadataName ]
	);

	// Use ref to store the openModal callback so the command loader always has access to latest state
	const openModalRef = useRef( () => {
		setIsRenameModalOpen( true );
	} );

	// Memoize the hook creation to prevent unnecessary re-renders
	const commandLoaderHook = useMemo(
		() => getRenameFormCommandLoader( openModalRef ),
		[] // openModalRef is stable (useRef)
	);

	useCommandLoader( {
		name: 'jetpack-forms/form-commands',
		hook: commandLoaderHook,
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
