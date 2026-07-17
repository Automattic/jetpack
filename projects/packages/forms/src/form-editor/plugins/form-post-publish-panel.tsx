/**
 * External dependencies
 */
import { useSelect, useDispatch } from '@wordpress/data';
import { store as editorStore } from '@wordpress/editor';
import { useCallback, useEffect, useRef, useState } from '@wordpress/element';
import { store as noticesStore } from '@wordpress/notices';
/**
 * Internal dependencies
 */
import { FORM_POST_TYPE } from '../../blocks/shared/util/constants.js';
import { EmbedFormModal } from './embed-form-modal';

export const FORM_POST_PUBLISH_PANEL_PLUGIN = 'jetpack-form-post-publish';

/**
 * Form Post-Publish Modal component.
 *
 * Shows a modal after a form is published for the first time, guiding users
 * to make their form visible on the site. Detects the publish transition
 * (non-published → published) and opens automatically.
 *
 * @return {JSX.Element|null} The post-publish modal or null.
 */
export const FormPostPublishPanel = () => {
	const [ isModalOpen, setIsModalOpen ] = useState( false );
	const handleCloseModal = useCallback( () => setIsModalOpen( false ), [] );
	const wasPublishedOnLoadRef = useRef< boolean | null >( null );
	const hasShownModalRef = useRef( false );

	const { postType, isPublished, isSaving } = useSelect( select => {
		const editor = select( editorStore ) as {
			getCurrentPostType: () => string;
			isCurrentPostPublished: () => boolean;
			isSavingPost: () => boolean;
		};

		return {
			postType: editor.getCurrentPostType(),
			isPublished: editor.isCurrentPostPublished(),
			isSaving: editor.isSavingPost(),
		};
	} );

	const { removeNotice } = useDispatch( noticesStore );

	// Detect the transition from non-published to published.
	// Records whether the form was already published when the editor loaded,
	// then watches for it to become published during this editing session.
	useEffect( () => {
		if ( postType !== FORM_POST_TYPE ) {
			return;
		}

		// On first render, record whether the form is already published.
		if ( wasPublishedOnLoadRef.current === null ) {
			wasPublishedOnLoadRef.current = isPublished;
			return;
		}

		// If the form was already published when the editor loaded, never show the modal.
		if ( wasPublishedOnLoadRef.current ) {
			return;
		}

		// Show the modal once when the post becomes published and saving completes.
		if ( isPublished && ! isSaving && ! hasShownModalRef.current ) {
			hasShownModalRef.current = true;
			setIsModalOpen( true );
			// Remove the default "Form published." snackbar since the modal replaces it.
			removeNotice( 'editor-save' );
		}
	}, [ postType, isPublished, isSaving, removeNotice ] );

	return (
		<EmbedFormModal isOpen={ isModalOpen } onClose={ handleCloseModal } variant="post-publish" />
	);
};
