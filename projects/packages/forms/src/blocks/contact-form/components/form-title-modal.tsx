import { store as coreStore } from '@wordpress/core-data';
import { useSelect } from '@wordpress/data';
import { store as editorStore } from '@wordpress/editor';
import { useState, useCallback, useEffect } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { FORM_POST_TYPE } from '../../shared/util/constants.js';
import FormNameModal from './form-name-modal.tsx';

type FormTitleModalProps = {
	hasInnerBlocks: boolean;
};

export default function FormTitleModal( { hasInnerBlocks }: FormTitleModalProps ) {
	const [ isOpen, setIsOpen ] = useState( false );
	const [ hasShown, setHasShown ] = useState( false );

	const { currentPostTitle } = useSelect( select => {
		const { getCurrentPostId } = select( editorStore );
		const { getEditedEntityRecord } = select( coreStore );

		const postId = getCurrentPostId();
		const post = postId ? getEditedEntityRecord( 'postType', FORM_POST_TYPE, postId ) : null;

		return {
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

	return (
		<FormNameModal
			isOpen={ isOpen }
			onClose={ handleClose }
			initialTitle=""
			modalTitle={ __( 'Create Form', 'jetpack-forms' ) }
			cancelLabel={ __( 'Skip', 'jetpack-forms' ) }
			submitLabel={ __( 'Create', 'jetpack-forms' ) }
		/>
	);
}
