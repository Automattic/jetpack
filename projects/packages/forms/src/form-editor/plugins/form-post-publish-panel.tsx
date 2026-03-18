/**
 * External dependencies
 */
import { Modal, Button, TextControl } from '@wordpress/components';
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
	const [ step, setStep ] = useState< 'initial' | 'title' | 'copied' >( 'initial' );
	const [ pageTitle, setPageTitle ] = useState( '' );
	const wasPublishedOnLoadRef = useRef< boolean | null >( null );
	const hasShownModalRef = useRef( false );

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

	const handleClose = useCallback( () => {
		setIsModalOpen( false );
	}, [] );

	const handleShowPageTitleInput = useCallback( () => {
		setPageTitle( postTitle || '' );
		setStep( 'title' );
	}, [ postTitle ] );

	const handleCreatePage = useCallback( async () => {
		setIsCreatingPage( true );
		try {
			const page = ( await saveEntityRecord( 'postType', 'page', {
				title: pageTitle || __( 'Untitled Form', 'jetpack-forms' ),
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
	}, [ pageTitle, embedCode, saveEntityRecord, createErrorNotice ] );

	const copyRef = useCopyToClipboard< HTMLButtonElement >( embedCode, () => {
		setStep( 'copied' );
	} );

	const handleBack = useCallback( () => setStep( 'initial' ), [] );

	if ( ! isModalOpen ) {
		return null;
	}

	const postsUrl = 'edit.php';
	const pagesUrl = addQueryArgs( postsUrl, { post_type: 'page' } );

	return (
		<Modal
			title={ __( 'Your form is ready — add it to a page', 'jetpack-forms' ) }
			onRequestClose={ handleClose }
			className="jetpack-form-post-publish-modal"
			size="medium"
		>
			<div className="jetpack-form-post-publish__content">
				<p className="jetpack-form-post-publish__subtitle">
					{ __( "Once it's on a page, visitors can start submitting responses.", 'jetpack-forms' ) }
				</p>
				{ step === 'initial' && (
					<>
						<Button
							variant="primary"
							onClick={ handleShowPageTitleInput }
							className="jetpack-form-post-publish__button"
						>
							{ __( 'Add to new page', 'jetpack-forms' ) }
						</Button>
						<div className="jetpack-form-post-publish__separator">
							<span>{ __( 'or', 'jetpack-forms' ) }</span>
						</div>
						<Button
							variant="secondary"
							ref={ copyRef }
							className="jetpack-form-post-publish__button"
						>
							{ __( 'Copy and add manually', 'jetpack-forms' ) }
						</Button>
					</>
				) }
				{ step === 'title' && (
					<>
						<TextControl
							label={ __( 'Page title', 'jetpack-forms' ) }
							value={ pageTitle }
							onChange={ setPageTitle }
							placeholder={ __( 'Untitled Form', 'jetpack-forms' ) }
						/>
						<div className="jetpack-form-post-publish__button-row">
							<Button
								variant="secondary"
								onClick={ handleBack }
								className="jetpack-form-post-publish__button"
							>
								{ __( 'Back', 'jetpack-forms' ) }
							</Button>
							<Button
								variant="primary"
								onClick={ handleCreatePage }
								disabled={ isCreatingPage }
								className="jetpack-form-post-publish__button"
							>
								{ isCreatingPage
									? __( 'Creating page…', 'jetpack-forms' )
									: __( 'Continue', 'jetpack-forms' ) }
							</Button>
						</div>
					</>
				) }
				{ step === 'copied' && (
					<>
						<p>{ __( 'Embed code copied! Paste it into any post or page.', 'jetpack-forms' ) }</p>
						<Button
							variant="secondary"
							href={ pagesUrl }
							className="jetpack-form-post-publish__button"
						>
							{ __( 'View Pages', 'jetpack-forms' ) }
						</Button>
						<Button
							variant="secondary"
							href={ postsUrl }
							className="jetpack-form-post-publish__button"
						>
							{ __( 'View Posts', 'jetpack-forms' ) }
						</Button>
					</>
				) }
			</div>
		</Modal>
	);
};
