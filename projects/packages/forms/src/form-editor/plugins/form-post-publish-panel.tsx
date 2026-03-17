/**
 * External dependencies
 */
import { Modal } from '@wordpress/components';
import { useCopyToClipboard } from '@wordpress/compose';
import { store as coreStore } from '@wordpress/core-data';
import { useSelect, useDispatch } from '@wordpress/data';
import { store as editorStore } from '@wordpress/editor';
import { useCallback, useEffect, useRef, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { Icon, copy, check, page as pageIcon, postList } from '@wordpress/icons';
import { store as noticesStore } from '@wordpress/notices';
import { addQueryArgs } from '@wordpress/url';
/**
 * Internal dependencies
 */
import { FORM_POST_TYPE } from '../../blocks/shared/util/constants.js';
import './form-post-publish-panel.scss';

export const FORM_POST_PUBLISH_PANEL_PLUGIN = 'jetpack-form-post-publish';

const PAGES_URL = addQueryArgs( 'edit.php', { post_type: 'page' } );
const POSTS_URL = 'edit.php';

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
	const [ showCopyConfirmation, setShowCopyConfirmation ] = useState( false );
	const hasEverCopiedRef = useRef( false );
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

	const handleClose = useCallback( () => {
		setIsModalOpen( false );
	}, [] );

	const handleCreatePage = useCallback( async () => {
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
	}, [ postTitle, embedCode, saveEntityRecord, createErrorNotice ] );

	const copyRef = useCopyToClipboard< HTMLButtonElement >( embedCode, () => {
		setShowCopyConfirmation( true );
		hasEverCopiedRef.current = true;
		if ( copiedTimeoutRef.current ) {
			clearTimeout( copiedTimeoutRef.current );
		}
		copiedTimeoutRef.current = setTimeout( () => {
			copiedTimeoutRef.current = null;
			setShowCopyConfirmation( false );
		}, 3000 );
	} );

	useEffect( () => {
		return () => {
			if ( copiedTimeoutRef.current ) {
				clearTimeout( copiedTimeoutRef.current );
			}
		};
	}, [] );

	if ( ! isModalOpen ) {
		return null;
	}

	const createNewPageTitle = __( 'Create a new page with this form', 'jetpack-forms' );

	return (
		<Modal
			title={ __( 'Almost ready to collect responses \ud83c\udf89', 'jetpack-forms' ) }
			onRequestClose={ handleClose }
			className="jetpack-form-post-publish-modal"
			size="medium"
		>
			<div className="jetpack-form-post-publish__content">
				<p className="jetpack-form-post-publish__subtitle">
					{ __( 'Next steps:', 'jetpack-forms' ) }
				</p>
				<button type="button" className="jetpack-form-post-publish__action-card" ref={ copyRef }>
					<div className="jetpack-form-post-publish__action-icon">
						<Icon icon={ showCopyConfirmation ? check : copy } size={ 24 } />
					</div>
					<div className="jetpack-form-post-publish__action-text">
						<span className="jetpack-form-post-publish__action-title">
							{ __( 'Copy embed code', 'jetpack-forms' ) }
						</span>
						<span className="jetpack-form-post-publish__action-description">
							{ showCopyConfirmation
								? __( 'Copied to clipboard!', 'jetpack-forms' )
								: __( 'Paste it into any post or page.', 'jetpack-forms' ) }
						</span>
					</div>
				</button>
				<div
					className={ `jetpack-form-post-publish__reveal${
						hasEverCopiedRef.current ? ' is-visible' : ''
					}` }
				>
					<div className="jetpack-form-post-publish__reveal-inner">
						<a
							className="jetpack-form-post-publish__action-card"
							href={ PAGES_URL }
							tabIndex={ hasEverCopiedRef.current ? undefined : -1 }
						>
							<div className="jetpack-form-post-publish__action-icon">
								<Icon icon={ pageIcon } size={ 24 } />
							</div>
							<div className="jetpack-form-post-publish__action-text">
								<span className="jetpack-form-post-publish__action-title">
									{ __( 'View Pages', 'jetpack-forms' ) }
								</span>
								<span className="jetpack-form-post-publish__action-description">
									{ __( 'Open the pages list to paste the embed code.', 'jetpack-forms' ) }
								</span>
							</div>
						</a>
						<a
							className="jetpack-form-post-publish__action-card"
							href={ POSTS_URL }
							tabIndex={ hasEverCopiedRef.current ? undefined : -1 }
						>
							<div className="jetpack-form-post-publish__action-icon">
								<Icon icon={ postList } size={ 24 } />
							</div>
							<div className="jetpack-form-post-publish__action-text">
								<span className="jetpack-form-post-publish__action-title">
									{ __( 'View Posts', 'jetpack-forms' ) }
								</span>
								<span className="jetpack-form-post-publish__action-description">
									{ __( 'Open the posts list to paste the embed code.', 'jetpack-forms' ) }
								</span>
							</div>
						</a>
					</div>
				</div>
				<button
					type="button"
					className="jetpack-form-post-publish__action-card"
					onClick={ handleCreatePage }
					disabled={ isCreatingPage }
				>
					<div className="jetpack-form-post-publish__action-icon">
						<Icon icon={ pageIcon } size={ 24 } />
					</div>
					<div className="jetpack-form-post-publish__action-text">
						<span className="jetpack-form-post-publish__action-title">{ createNewPageTitle }</span>
						<span className="jetpack-form-post-publish__action-description">
							{ __( 'Use this form to quickly create a new page.', 'jetpack-forms' ) }
						</span>
					</div>
				</button>
			</div>
		</Modal>
	);
};
