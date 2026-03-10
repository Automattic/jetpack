/**
 * External dependencies
 */
import { Button, Modal } from '@wordpress/components';
import { useCopyToClipboard } from '@wordpress/compose';
import { store as coreStore } from '@wordpress/core-data';
import { useSelect, useDispatch } from '@wordpress/data';
import { store as editorStore } from '@wordpress/editor';
import { useCallback, useEffect, useRef, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { store as noticesStore } from '@wordpress/notices';
import { addQueryArgs } from '@wordpress/url';
/**
 * Internal dependencies
 */
import { FORM_POST_TYPE } from '../../blocks/shared/util/constants.js';
import './form-post-publish-panel.scss';

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
	const [ isCreatingPage, setIsCreatingPage ] = useState( false );
	const [ showCopied, setShowCopied ] = useState( false );
	const wasPublishedOnLoadRef = useRef< boolean | null >( null );
	const hasShownModalRef = useRef( false );
	const copiedTimeoutRef = useRef< number | null >( null );

	const { postId, postTitle, postType, isPublished, isSaving } = useSelect( select => {
		const editor = select( editorStore ) as {
			getCurrentPostType: () => string;
			getCurrentPostId: () => number;
			getEditedPostAttribute: ( attr: string ) => unknown;
			isCurrentPostPublished: () => boolean;
			isSavingPost: () => boolean;
		};

		return {
			postId: editor.getCurrentPostId(),
			postTitle: editor.getEditedPostAttribute( 'title' ) as string,
			postType: editor.getCurrentPostType(),
			isPublished: editor.isCurrentPostPublished(),
			isSaving: editor.isSavingPost(),
		};
	} );

	const { saveEntityRecord } = useDispatch( coreStore );
	const { createErrorNotice, removeNotice } = useDispatch( noticesStore );

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

	const embedCode = `<!-- wp:jetpack/contact-form {"ref":${ postId }} /-->`;

	const handleCreatePage = useCallback( async () => {
		if ( isCreatingPage ) {
			return;
		}

		setIsCreatingPage( true );
		try {
			const page = ( await saveEntityRecord( 'postType', 'page', {
				title: postTitle || __( 'Untitled Form', 'jetpack-forms' ),
				content: embedCode,
				status: 'draft',
			} ) ) as { id: number } | undefined;

			if ( page?.id ) {
				window.location.href = addQueryArgs( 'post.php', {
					post: page.id,
					action: 'edit',
				} );
			}
		} catch {
			createErrorNotice( __( 'Failed to create page. Please try again.', 'jetpack-forms' ), {
				type: 'snackbar',
			} );
			setIsCreatingPage( false );
		}
	}, [ isCreatingPage, postTitle, embedCode, saveEntityRecord, createErrorNotice ] );

	const handleClose = useCallback( () => {
		setIsModalOpen( false );
	}, [] );

	const copyButtonRef = useCopyToClipboard( embedCode, () => {
		setShowCopied( true );
		if ( copiedTimeoutRef.current ) {
			clearTimeout( copiedTimeoutRef.current );
		}
		copiedTimeoutRef.current = setTimeout( () => {
			setShowCopied( false );
		}, 2000 );
	} );

	if ( ! isModalOpen ) {
		return null;
	}

	return (
		<Modal
			title={ __( 'Your form is ready \u2014 add it to a page', 'jetpack-forms' ) }
			onRequestClose={ handleClose }
			className="jetpack-form-post-publish-modal"
			size="medium"
		>
			<div className="jetpack-form-post-publish__content">
				<p className="jetpack-form-post-publish__description">
					{ __(
						'Once it\u2019s on a page, visitors can start submitting responses.',
						'jetpack-forms'
					) }
				</p>
				<Button
					variant="primary"
					className="jetpack-form-post-publish__action-button"
					onClick={ handleCreatePage }
					isBusy={ isCreatingPage }
				>
					{ isCreatingPage
						? __( 'Creating page…', 'jetpack-forms' )
						: __( 'Add to new page', 'jetpack-forms' ) }
				</Button>
				<div className="jetpack-form-post-publish__manual">
					<Button
						ref={ copyButtonRef }
						variant="secondary"
						className="jetpack-form-post-publish__action-button"
					>
						{ showCopied
							? __( 'Copied!', 'jetpack-forms' )
							: __( 'Copy and add manually', 'jetpack-forms' ) }
					</Button>
				</div>
			</div>
		</Modal>
	);
};
