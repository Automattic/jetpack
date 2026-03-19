/**
 * External dependencies
 */
import { ComboboxControl, Modal, Button } from '@wordpress/components';
import { useCopyToClipboard } from '@wordpress/compose';
import { store as coreStore } from '@wordpress/core-data';
import { useSelect, useDispatch } from '@wordpress/data';
import { store as editorStore } from '@wordpress/editor';
import { useCallback, useEffect, useRef, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { store as noticesStore } from '@wordpress/notices';
import { Field, Input, InputLayout } from '@wordpress/ui';
import { addQueryArgs } from '@wordpress/url';
/**
 * Internal dependencies
 */
import { FORM_POST_TYPE } from '../../blocks/shared/util/constants.js';
import CopyClipboardButton from '../../dashboard/components/copy-clipboard-button';
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
	const [ isRedirecting, setIsRedirecting ] = useState( false );
	const [ step, setStep ] = useState< 'initial' | 'title' | 'existing' | 'copied' >( 'initial' );
	const [ pageTitle, setPageTitle ] = useState( '' );
	const [ selectedPageId, setSelectedPageId ] = useState< string | null >( null );
	const wasPublishedOnLoadRef = useRef< boolean | null >( null );
	const hasShownModalRef = useRef( false );
	const pageTitleInputRef = useRef< HTMLInputElement >( null );

	const { postId, postTitle, postType, isPublished, isSaving, pages } = useSelect( select => {
		const editor = select( editorStore ) as {
			getCurrentPostType: () => string;
			getCurrentPostId: () => number;
			getEditedPostAttribute: ( attr: string ) => unknown;
			isCurrentPostPublished: () => boolean;
			isSavingPost: () => boolean;
		};

		const records =
			(
				select( coreStore ) as {
					getEntityRecords: (
						kind: string,
						name: string,
						query: Record< string, unknown >
					) => Array< { id: number; title: { rendered: string } } > | null;
				}
			 ).getEntityRecords( 'postType', 'page', {
				status: 'publish',
				per_page: 20,
				orderby: 'modified',
				_fields: 'id,title',
			} ) || [];

		return {
			postId: editor.getCurrentPostId(),
			postTitle: editor.getEditedPostAttribute( 'title' ) as string,
			postType: editor.getCurrentPostType(),
			isPublished: editor.isCurrentPostPublished(),
			isSaving: editor.isSavingPost(),
			pages: records.map( p => ( {
				value: String( p.id ),
				label: p.title.rendered || __( '(no title)', 'jetpack-forms' ),
			} ) ),
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
	const shortcode = `[contact-form ref="${ postId }"]`;

	const handleClose = useCallback( () => {
		setIsModalOpen( false );
	}, [] );

	const handleShowPageTitleInput = useCallback( () => {
		setPageTitle( postTitle || '' );
		setStep( 'title' );
		// Focus the title input after the step renders.
		requestAnimationFrame( () => pageTitleInputRef.current?.focus() );
	}, [ postTitle ] );

	const handlePageTitleChange = useCallback(
		( e: React.ChangeEvent< HTMLInputElement > ) => setPageTitle( e.target.value ),
		[]
	);

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

	const handleShowExistingPages = useCallback( () => {
		setSelectedPageId( null );
		setStep( 'existing' );
	}, [] );

	const handleGoToExistingPage = useCallback( () => {
		if ( ! selectedPageId ) {
			return;
		}
		navigator.clipboard.writeText( embedCode );
		setIsRedirecting( true );
		setTimeout( () => {
			window.location.href = addQueryArgs( 'post.php', {
				post: Number( selectedPageId ),
				action: 'edit',
			} );
		}, 1000 );
	}, [ selectedPageId, embedCode ] );

	const copyRef = useCopyToClipboard< HTMLButtonElement >( embedCode, () => {
		setStep( 'copied' );
	} );

	const handleBack = useCallback( () => setStep( 'initial' ), [] );

	if ( ! isModalOpen ) {
		return null;
	}

	const pagesUrl = addQueryArgs( 'edit.php', { post_type: 'page' } );

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
				<div key={ step } className="jetpack-form-post-publish__step">
					{ step === 'initial' && (
						<>
							<Button
								variant="primary"
								onClick={ handleShowPageTitleInput }
								className="jetpack-form-post-publish__button"
							>
								{ __( 'Add to new page', 'jetpack-forms' ) }
							</Button>
							<Button
								variant="secondary"
								onClick={ handleShowExistingPages }
								className="jetpack-form-post-publish__button"
							>
								{ __( 'Add to existing page', 'jetpack-forms' ) }
							</Button>
							<div className="jetpack-form-post-publish__separator">
								<span>{ __( 'or', 'jetpack-forms' ) }</span>
							</div>
							<Button
								variant="tertiary"
								ref={ copyRef }
								className="jetpack-form-post-publish__button"
							>
								{ __( 'Copy and add manually', 'jetpack-forms' ) }
							</Button>
						</>
					) }
					{ step === 'title' && (
						<>
							<Field.Root>
								<Field.Label>{ __( 'Page title', 'jetpack-forms' ) }</Field.Label>
								<Input
									value={ pageTitle }
									onChange={ handlePageTitleChange }
									placeholder={ __( 'Untitled Form', 'jetpack-forms' ) }
									ref={ pageTitleInputRef }
								/>
							</Field.Root>
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
										: __( 'Create page', 'jetpack-forms' ) }
								</Button>
							</div>
						</>
					) }
					{ step === 'existing' && (
						<>
							<ComboboxControl
								label={ __( 'Select a page', 'jetpack-forms' ) }
								value={ selectedPageId }
								onChange={ setSelectedPageId }
								options={ pages }
							/>
							<p className="jetpack-form-post-publish__hint">
								{ __( 'Your form will be copied — just paste it into the page.', 'jetpack-forms' ) }
							</p>
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
									onClick={ handleGoToExistingPage }
									disabled={ ! selectedPageId || isRedirecting }
									className="jetpack-form-post-publish__button"
								>
									{ isRedirecting
										? __( 'Copied! Opening page…', 'jetpack-forms' )
										: __( 'Copy & go to page', 'jetpack-forms' ) }
								</Button>
							</div>
						</>
					) }
					{ step === 'copied' && (
						<>
							<Input
								readOnly
								value={ embedCode }
								className="jetpack-form-post-publish__code-input"
								suffix={
									<InputLayout.Slot padding="minimal">
										<CopyClipboardButton
											text={ embedCode }
											copyMessage={ __( 'Copy embed code', 'jetpack-forms' ) }
											copiedMessage={ __( 'Embed code copied!', 'jetpack-forms' ) }
										/>
									</InputLayout.Slot>
								}
							/>
							<Input
								readOnly
								value={ shortcode }
								className="jetpack-form-post-publish__code-input"
								suffix={
									<InputLayout.Slot padding="minimal">
										<CopyClipboardButton
											text={ shortcode }
											copyMessage={ __( 'Copy shortcode', 'jetpack-forms' ) }
											copiedMessage={ __( 'Shortcode copied!', 'jetpack-forms' ) }
										/>
									</InputLayout.Slot>
								}
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
									href={ pagesUrl }
									className="jetpack-form-post-publish__button"
								>
									{ __( 'View Pages', 'jetpack-forms' ) }
								</Button>
							</div>
						</>
					) }
				</div>
			</div>
		</Modal>
	);
};
