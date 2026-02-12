import { useState, useCallback, useEffect } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { useFormMetadata } from '../hooks/use-form-metadata.ts';
import FormNameModal from './form-name-modal.tsx';

type FormTitleModalProps = {
	hasInnerBlocks: boolean;
	clientId: string;
};

export default function FormTitleModal( { hasInnerBlocks, clientId }: FormTitleModalProps ) {
	const [ isOpen, setIsOpen ] = useState( false );
	const [ hasShown, setHasShown ] = useState( false );

	const { currentPostTitle, updateMetadataName } = useFormMetadata( clientId );

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

	const handleSave = useCallback(
		( title: string ) => {
			updateMetadataName( title );
		},
		[ updateMetadataName ]
	);

	return (
		<FormNameModal
			isOpen={ isOpen }
			onClose={ handleClose }
			onSave={ handleSave }
			initialTitle=""
			modalTitle={ __( 'Create Form', 'jetpack-forms' ) }
			cancelLabel={ __( 'Skip', 'jetpack-forms' ) }
			submitLabel={ __( 'Create', 'jetpack-forms' ) }
		/>
	);
}
