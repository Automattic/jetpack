/**
 * External dependencies
 */
import {
	ComboboxControl,
	Modal,
	Button,
	__experimentalVStack as VStack, // eslint-disable-line @wordpress/no-unsafe-wp-apis
	__experimentalHStack as HStack, // eslint-disable-line @wordpress/no-unsafe-wp-apis
	__experimentalText as Text, // eslint-disable-line @wordpress/no-unsafe-wp-apis
} from '@wordpress/components';
import { useCopyToClipboard, debounce } from '@wordpress/compose';
import { store as coreStore } from '@wordpress/core-data';
import { useSelect, useDispatch } from '@wordpress/data';
import { store as editorStore } from '@wordpress/editor';
import { useCallback, useEffect, useMemo, useRef, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { store as noticesStore } from '@wordpress/notices';
import { Field, Input, InputLayout } from '@wordpress/ui';
import { addQueryArgs } from '@wordpress/url';
/**
 * Internal dependencies
 */
import { getEmbedCode, getShortcode } from '../../blocks/shared/util/embed-codes';
import CopyClipboardButton from '../../dashboard/components/copy-clipboard-button';
import './embed-form-modal.scss';

type EmbedFormModalProps = {
	isOpen: boolean;
	onClose: () => void;
	variant?: 'post-publish' | 'embed';
};

/**
 * Reusable modal that helps users embed a form on a page.
 *
 * @param {EmbedFormModalProps} props - The component props.
 * @return {JSX.Element|null} The embed form modal or null.
 */
export const EmbedFormModal = ( { isOpen, onClose, variant = 'embed' }: EmbedFormModalProps ) => {
	const [ isCreatingPage, setIsCreatingPage ] = useState( false );
	const [ isRedirecting, setIsRedirecting ] = useState( false );
	const [ step, setStep ] = useState< 'initial' | 'title' | 'existing' | 'copied' >( 'initial' );
	const [ pageTitle, setPageTitle ] = useState( '' );
	const [ selectedPageId, setSelectedPageId ] = useState< string | null >( null );
	const [ searchTerm, setSearchTerm ] = useState( '' );
	const debouncedSetSearchTerm = useMemo( () => debounce( setSearchTerm, 300 ), [] );
	const pageTitleInputRef = useRef< HTMLInputElement >( null );
	const redirectTimeoutRef = useRef< ReturnType< typeof setTimeout > | null >( null );

	// Cancel any pending debounce timer and redirect timeout on unmount.
	useEffect( () => {
		return () => {
			debouncedSetSearchTerm.cancel();
			if ( redirectTimeoutRef.current ) {
				clearTimeout( redirectTimeoutRef.current );
			}
		};
	}, [ debouncedSetSearchTerm ] );

	const { postId, postTitle, pageRecords } = useSelect(
		select => {
			const editor = select( editorStore ) as {
				getCurrentPostId: () => number;
				getEditedPostAttribute: ( attr: string ) => unknown;
			};

			// Only fetch page records when the modal is open to avoid unnecessary API calls.
			let records = null;
			if ( isOpen ) {
				const entityStore = select( coreStore ) as {
					getEntityRecords: (
						kind: string,
						name: string,
						query: Record< string, unknown >
					) => Array< { id: number; title: { rendered: string } } > | null;
				};

				const searchQuery: Record< string, unknown > = {
					status: 'publish',
					per_page: 20,
					_fields: 'id,title',
					...( searchTerm.trim() ? { search: searchTerm.trim() } : { orderby: 'modified' } ),
				};

				records = entityStore.getEntityRecords( 'postType', 'page', searchQuery );
			}

			return {
				postId: editor.getCurrentPostId(),
				postTitle: editor.getEditedPostAttribute( 'title' ) as string,
				pageRecords: records,
			};
		},
		[ isOpen, searchTerm ]
	);

	const pageOptions = useMemo( () => {
		if ( ! pageRecords ) {
			return [];
		}
		const noTitle = __( '(no title)', 'jetpack-forms' );
		return pageRecords.map( p => ( {
			value: String( p.id ),
			label: p.title.rendered || noTitle,
		} ) );
	}, [ pageRecords ] );

	const { saveEntityRecord } = useDispatch( coreStore );
	const { createErrorNotice } = useDispatch( noticesStore );

	const handleClose = useCallback( () => {
		onClose();
		// Cancel any pending redirect.
		if ( redirectTimeoutRef.current ) {
			clearTimeout( redirectTimeoutRef.current );
			redirectTimeoutRef.current = null;
		}
		// Reset all state when closing so re-opening starts fresh.
		setStep( 'initial' );
		setPageTitle( '' );
		setSelectedPageId( null );
		setSearchTerm( '' );
		setIsCreatingPage( false );
		setIsRedirecting( false );
	}, [ onClose ] );

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
				content: getEmbedCode( postId ),
				status: 'draft',
			} ) ) as { id: number } | undefined;

			if ( page?.id ) {
				window.location.href = addQueryArgs( 'post.php', {
					post: page.id,
					action: 'edit',
				} );
			} else {
				createErrorNotice( __( 'Failed to create page. Please try again.', 'jetpack-forms' ), {
					type: 'snackbar',
				} );
				setIsCreatingPage( false );
			}
		} catch {
			createErrorNotice( __( 'Failed to create page. Please try again.', 'jetpack-forms' ), {
				type: 'snackbar',
			} );
			setIsCreatingPage( false );
		}
	}, [ pageTitle, postId, saveEntityRecord, createErrorNotice ] );

	const handleShowExistingPages = useCallback( () => {
		setSelectedPageId( null );
		setStep( 'existing' );
		// Focus the combobox input after the step renders so the dropdown opens immediately.
		requestAnimationFrame( () => {
			const input = document.querySelector< HTMLInputElement >(
				'.jetpack-form-embed-form-modal .components-combobox-control input'
			);
			input?.focus();
		} );
	}, [] );

	const handleGoToExistingPage = useCallback( async () => {
		if ( ! selectedPageId ) {
			return;
		}
		try {
			await navigator.clipboard.writeText( getEmbedCode( postId ) );
		} catch {
			createErrorNotice( __( 'Failed to copy embed code. Please try again.', 'jetpack-forms' ), {
				type: 'snackbar',
			} );
			return;
		}
		setIsRedirecting( true );
		redirectTimeoutRef.current = setTimeout( () => {
			window.location.href = addQueryArgs( 'post.php', {
				post: Number( selectedPageId ),
				action: 'edit',
			} );
		}, 1000 );
	}, [ selectedPageId, postId, createErrorNotice ] );

	const copyRef = useCopyToClipboard< HTMLButtonElement >( getEmbedCode( postId ), () => {
		setStep( 'copied' );
	} );

	const handleBack = useCallback( () => setStep( 'initial' ), [] );

	if ( ! isOpen ) {
		return null;
	}

	const embedCode = getEmbedCode( postId );
	const shortcode = getShortcode( postId );
	const pagesUrl = addQueryArgs( 'edit.php', { post_type: 'page' } );

	// Hoist translation calls out of ternaries to avoid i18n build errors.
	const titlePostPublish = __( 'Your form is ready — add it to a page', 'jetpack-forms' );
	const titleEmbed = __( 'Embed form', 'jetpack-forms' );
	const creatingPageLabel = __( 'Creating page…', 'jetpack-forms' );
	const createPageLabel = __( 'Create page', 'jetpack-forms' );
	const copiedOpeningLabel = __( 'Copied! Opening page…', 'jetpack-forms' );
	const copyGoToPageLabel = __( 'Copy & go to page', 'jetpack-forms' );

	return (
		<Modal
			title={ variant === 'post-publish' ? titlePostPublish : titleEmbed }
			onRequestClose={ handleClose }
			className="jetpack-form-embed-form-modal"
			size="medium"
		>
			<VStack spacing={ 4 }>
				{ variant === 'post-publish' && (
					<Text>
						{ __(
							"Once it's on a page, visitors can start submitting responses.",
							'jetpack-forms'
						) }
					</Text>
				) }
				<VStack key={ step } spacing={ 4 } className="jetpack-form-embed-form__step">
					{ step === 'initial' && (
						<>
							<Button
								variant="primary"
								onClick={ handleShowPageTitleInput }
								className="jetpack-form-embed-form__button"
							>
								{ __( 'Add to a new page', 'jetpack-forms' ) }
							</Button>
							<Button
								variant="secondary"
								onClick={ handleShowExistingPages }
								className="jetpack-form-embed-form__button"
							>
								{ __( 'Add to existing page', 'jetpack-forms' ) }
							</Button>
							<div className="jetpack-form-embed-form__separator">
								<span>{ __( 'or', 'jetpack-forms' ) }</span>
							</div>
							<Button
								variant="tertiary"
								ref={ copyRef }
								className="jetpack-form-embed-form__button"
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
							<HStack spacing={ 3 }>
								<Button
									variant="secondary"
									onClick={ handleBack }
									className="jetpack-form-embed-form__button"
								>
									{ __( 'Back', 'jetpack-forms' ) }
								</Button>
								<Button
									variant="primary"
									onClick={ handleCreatePage }
									disabled={ isCreatingPage }
									isBusy={ isCreatingPage }
									className="jetpack-form-embed-form__button"
								>
									{ isCreatingPage ? creatingPageLabel : createPageLabel }
								</Button>
							</HStack>
						</>
					) }
					{ step === 'existing' && (
						<div className="jetpack-form-embed-form__combobox-wrapper">
							<VStack spacing={ 4 } className="jetpack-form-embed-form__combobox-wrapper-inner">
								<ComboboxControl
									__next40pxDefaultSize
									label={ __( 'Select a page', 'jetpack-forms' ) }
									value={ selectedPageId }
									onChange={ setSelectedPageId }
									options={ pageOptions }
									onFilterValueChange={ debouncedSetSearchTerm }
								/>
								<Text color="#757575" size="12px">
									{ __(
										'Your form will be copied — just paste it into the page.',
										'jetpack-forms'
									) }
								</Text>
								<HStack spacing={ 3 }>
									<Button
										variant="secondary"
										onClick={ handleBack }
										className="jetpack-form-embed-form__button"
									>
										{ __( 'Back', 'jetpack-forms' ) }
									</Button>
									<Button
										variant="primary"
										onClick={ handleGoToExistingPage }
										disabled={ ! selectedPageId || isRedirecting }
										isBusy={ isRedirecting }
										className="jetpack-form-embed-form__button"
									>
										{ isRedirecting ? copiedOpeningLabel : copyGoToPageLabel }
									</Button>
								</HStack>
							</VStack>
						</div>
					) }
					{ step === 'copied' && (
						<>
							<Input
								readOnly
								value={ embedCode }
								className="jetpack-form-embed-form__code-input"
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
								className="jetpack-form-embed-form__code-input"
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
							<HStack spacing={ 3 }>
								<Button
									variant="secondary"
									onClick={ handleBack }
									className="jetpack-form-embed-form__button"
								>
									{ __( 'Back', 'jetpack-forms' ) }
								</Button>
								<Button
									variant="primary"
									href={ pagesUrl }
									className="jetpack-form-embed-form__button"
								>
									{ __( 'View Pages', 'jetpack-forms' ) }
								</Button>
							</HStack>
						</>
					) }
				</VStack>
			</VStack>
		</Modal>
	);
};
