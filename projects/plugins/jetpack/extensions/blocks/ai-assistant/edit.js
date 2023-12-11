/**
 * External dependencies
 */
import { AIControl } from '@automattic/jetpack-ai-client';
import { useAnalytics } from '@automattic/jetpack-shared-extension-utils';
import { useBlockProps, useInnerBlocksProps, InspectorControls } from '@wordpress/block-editor';
import { rawHandler, createBlock, parse } from '@wordpress/blocks';
import {
	Flex,
	FlexBlock,
	Modal,
	Notice,
	PanelBody,
	PanelRow,
	ToggleControl,
	TextareaControl,
	Button,
	KeyboardShortcuts,
} from '@wordpress/components';
import { useViewportMatch } from '@wordpress/compose';
import { useSelect, useDispatch } from '@wordpress/data';
import { RawHTML, useState, useCallback } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import classNames from 'classnames';
import MarkdownIt from 'markdown-it';
import { useEffect, useRef } from 'react';
/**
 * Internal dependencies
 */
import UsagePanel from '../../plugins/ai-assistant-plugin/components/usage-panel';
import { USAGE_PANEL_PLACEMENT_BLOCK_SETTINGS_SIDEBAR } from '../../plugins/ai-assistant-plugin/components/usage-panel/types';
import ConnectPrompt from './components/connect-prompt';
import FeedbackControl from './components/feedback-control';
import ImageWithSelect from './components/image-with-select';
import { promptTemplates } from './components/prompt-templates-control';
import ToolbarControls from './components/toolbar-controls';
import UpgradePrompt from './components/upgrade-prompt';
import { getStoreBlockId } from './extensions/ai-assistant/with-ai-assistant';
import useAiFeature from './hooks/use-ai-feature';
import useSuggestionsFromOpenAI from './hooks/use-suggestions-from-openai';
import { isUserConnected } from './lib/connection';
import { getImagesFromOpenAI } from './lib/image';
import { getInitialSystemPrompt } from './lib/prompt';
import './editor.scss';

const markdownConverter = new MarkdownIt( {
	breaks: true,
} );

const isInBlockEditor = window?.Jetpack_Editor_Initial_State?.screenBase === 'post';
const isPlaygroundVisible =
	window?.Jetpack_Editor_Initial_State?.[ 'ai-assistant' ]?.[ 'is-playground-visible' ];

export default function AIAssistantEdit( { attributes, setAttributes, clientId, isSelected } ) {
	const [ userPrompt, setUserPrompt ] = useState();
	const [ errorData, setError ] = useState( {} );
	const [ loadingImages, setLoadingImages ] = useState( false );
	const [ resultImages, setResultImages ] = useState( [] );
	const [ imageModal, setImageModal ] = useState( null );
	const [ errorDismissed, setErrorDismissed ] = useState( null );
	const { tracks } = useAnalytics();
	const postId = useSelect( select => select( 'core/editor' ).getCurrentPostId() );

	const { getBlock } = useSelect( 'core/block-editor' );

	const aiControlRef = useRef( null );
	const blockRef = useRef( null );

	const { replaceBlocks, replaceBlock, removeBlock } = useDispatch( 'core/block-editor' );
	const { editPost } = useDispatch( 'core/editor' );
	const { mediaUpload } = useSelect( select => {
		const { getSettings } = select( 'core/block-editor' );
		const settings = getSettings();
		return {
			mediaUpload: settings.mediaUpload,
		};
	}, [] );

	const { isOverLimit, requireUpgrade, increaseRequestsCount } = useAiFeature();

	const focusOnPrompt = () => {
		/*
		 * Increase the AI Suggestion counter.
		 * @todo: move this at store level.
		 */
		// Small delay to avoid focus crash
		setTimeout( () => {
			aiControlRef.current?.focus?.();
		}, 100 );
	};

	const focusOnBlock = () => {
		// Small delay to avoid focus crash
		setTimeout( () => {
			blockRef.current?.focus?.();
		}, 100 );
	};

	const isMobileViewport = useViewportMatch( 'medium', '<' );

	const {
		isLoadingCategories,
		isLoadingCompletion,
		wasCompletionJustRequested,
		getSuggestionFromOpenAI,
		stopSuggestion,
		showRetry,
		contentBefore,
		postTitle,
		retryRequest,
		wholeContent,
		requestingState,
	} = useSuggestionsFromOpenAI( {
		onSuggestionDone: useCallback( () => {
			focusOnPrompt();
			increaseRequestsCount();
		}, [ increaseRequestsCount ] ),
		onUnclearPrompt: useCallback( () => {
			focusOnBlock();
			increaseRequestsCount();
		}, [ increaseRequestsCount ] ),
		onModeration: focusOnPrompt,
		attributes,
		clientId,
		content: attributes.content,
		setError,
		tracks,
		userPrompt,
		requireUpgrade,
	} );

	const connected = isUserConnected();

	/*
	 * Auto request the prompt if we detect
	 * it was previously defined in the local storage.
	 */
	const storeBlockId = getStoreBlockId( clientId );
	useEffect( () => {
		if ( ! storeBlockId ) {
			return;
		}

		// Get the parsed data from the local storage.
		const data = JSON.parse( localStorage.getItem( storeBlockId ) );
		if ( ! data ) {
			return;
		}

		const { type, options } = data;

		// Clean up the local storage asap.
		localStorage.removeItem( storeBlockId );

		getSuggestionFromOpenAI( type, options );
	}, [ storeBlockId, getSuggestionFromOpenAI ] );

	useEffect( () => {
		if ( errorData ) {
			setErrorDismissed( false );
		}
	}, [ errorData ] );

	/*
	 * Populate the block with inner blocks if:
	 * - It's the first time the block is rendered
	 * - It's Gutenberg syntax enabled
	 * - The block doesn't have children blocks
	 * - The `content` attribute contains contains blocks definition
	 */
	const initialContent = useRef( attributes?.content );
	useEffect( () => {
		// Check if is Gutenberg syntax enabled
		if ( ! attributes?.useGutenbergSyntax ) {
			return;
		}

		// Bail out if the block doesn't have content (via attribute)
		if ( ! initialContent?.current?.length ) {
			return;
		}

		// Bail out if the block already has children blocks
		const block = getBlock( clientId );
		if ( block?.innerBlocks?.length ) {
			return;
		}

		/*
		 * Bail out if the content doesn't contain blocks definition
		 * This is a very basic check, but it's enough for now.
		 * If the content hasn't blocks defined by using Gutenberg syntax,
		 * it can parse undesired blocks. Eg: `core/freeform` block :scream:
		 */
		const storedInnerBlocks = parse( initialContent.current );
		if ( ! storedInnerBlocks?.length ) {
			return;
		}

		// Populate block inner blocks
		replaceBlocks( clientId, storedInnerBlocks );
	}, [ initialContent, clientId, replaceBlocks, getBlock, attributes?.useGutenbergSyntax ] );

	const [ promptPlaceholder, setPromptPlaceholder ] = useState( '' );
	const [ currentIndex, setCurrentIndex ] = useState( 0 );

	// Loop through placeholder prompts for a nice UX effect.
	useEffect( () => {
		const interval = setInterval( () => {
			if ( currentIndex < promptTemplates.length ) {
				setPromptPlaceholder( promptTemplates[ currentIndex ].label );
				setCurrentIndex( prevIndex => prevIndex + 1 );
			} else {
				clearInterval( interval );
				setPromptPlaceholder( __( 'Ask Jetpack AI', 'jetpack' ) );
			}
		}, 1600 );

		return () => clearInterval( interval );
	}, [ promptPlaceholder, currentIndex ] );

	const saveImage = async image => {
		if ( loadingImages ) {
			return;
		}
		setLoadingImages( true );
		setError( {} );

		// First convert image to a proper blob file
		const resp = await fetch( image );
		const blob = await resp.blob();
		const file = new File( [ blob ], 'jetpack_ai_image.png', {
			type: 'image/png',
		} );
		// Actually upload the image
		mediaUpload( {
			filesList: [ file ],
			onFileChange: ( [ img ] ) => {
				if ( ! img.id ) {
					// Without this image gets uploaded twice
					return;
				}
				replaceBlock(
					clientId,
					createBlock( 'core/image', {
						url: img.url,
						caption: attributes.requestedPrompt,
						alt: attributes.requestedPrompt,
					} )
				);
			},
			allowedTypes: [ 'image' ],
			onError: message => {
				// eslint-disable-next-line no-console
				console.error( message );
				setLoadingImages( false );
			},
		} );
		tracks.recordEvent( 'jetpack_ai_dalle_generation_upload', {
			post_id: postId,
		} );
	};

	const useGutenbergSyntax = attributes?.useGutenbergSyntax;

	// Waiting state means there is nothing to be done until it resolves
	const isWaitingState = isLoadingCompletion || isLoadingCategories;
	// Content is loaded
	const contentIsLoaded = !! attributes.content;

	const getLastEditableElement = newContentBlocks => {
		let lastEditableElement = null;

		newContentBlocks.forEach( block => {
			const element = document.querySelector( `.wp-block[data-block="${ block.clientId }"]` );
			if ( ! element ) {
				return;
			}

			if ( element.contentEditable === 'true' ) {
				lastEditableElement = element;
			}

			const editableChildren = element.querySelectorAll( `[contenteditable=true]` );
			lastEditableElement = editableChildren.length
				? editableChildren[ editableChildren.length - 1 ]
				: lastEditableElement;
		} );

		return lastEditableElement;
	};

	const isGeneratingTitle = attributes.promptType === 'generateTitle';

	const acceptContentLabel = __( 'Accept', 'jetpack' );
	const acceptTitleLabel = __( 'Accept title', 'jetpack' );
	const acceptLabel = isGeneratingTitle ? acceptTitleLabel : acceptContentLabel;

	const moveCaretToEnd = element => {
		const selection = window.getSelection();
		selection.selectAllChildren( element );
		selection.collapseToEnd();
		element.focus();
	};

	const handleGetSuggestion = ( ...args ) => {
		getSuggestionFromOpenAI( ...args );
		focusOnBlock();
		return;
	};

	const handleChange = value => {
		setErrorDismissed( true );
		setUserPrompt( value );
	};

	const handleSend = () => {
		handleGetSuggestion( 'userPrompt' );
	};

	const handleAccept = () => {
		if ( isGeneratingTitle ) {
			handleAcceptTitle();
		} else {
			handleAcceptContent();
		}
	};

	const handleAcceptContent = async () => {
		let newGeneratedBlocks = [];
		if ( ! useGutenbergSyntax ) {
			/*
			 * Markdown-syntax content
			 * - Get HTML code from markdown content
			 * - Create blocks from HTML code
			 */
			const HTML = markdownConverter
				.render( attributes.content )
				// Fix list indentation
				.replace( /<li>\s+<p>/g, '<li>' )
				.replace( /<\/p>\s+<\/li>/g, '</li>' );
			newGeneratedBlocks = rawHandler( { HTML: HTML } );
		} else {
			/*
			 * Gutenberg-syntax content
			 * - Blocks are already created
			 * - blocks are children of the current block
			 */
			newGeneratedBlocks = getBlock( clientId );
			newGeneratedBlocks = newGeneratedBlocks?.innerBlocks || [];
		}

		// Replace the block with the new generated blocks
		await replaceBlocks( clientId, newGeneratedBlocks );

		// Move the caret to the end of the last editable element
		const lastEditableElement = getLastEditableElement( newGeneratedBlocks );
		if ( lastEditableElement ) {
			moveCaretToEnd( lastEditableElement );
		}
	};

	const handleAcceptTitle = () => {
		if ( isInBlockEditor ) {
			editPost( { title: attributes.content.trim() } );
			removeBlock( clientId );
		} else {
			handleAcceptContent();
		}
	};

	const handleTryAgain = () => {
		setAttributes( {
			content: attributes?.originalContent,
			promptType: undefined,
			messages: attributes?.originalMessages,
		} );
	};

	const handleStopSuggestion = () => {
		stopSuggestion();
		focusOnPrompt();
	};

	const handleImageRequest = () => {
		setResultImages( [] );
		setError( {} );

		getImagesFromOpenAI(
			userPrompt.trim() === '' ? __( 'What would you like to see?', 'jetpack' ) : userPrompt,
			setAttributes,
			setLoadingImages,
			setResultImages,
			setError,
			postId
		);

		tracks.recordEvent( 'jetpack_ai_dalle_generation', {
			post_id: postId,
		} );
	};

	/*
	 * Custom prompt modal
	 */
	const [ isCustomPrompModalVisible, setIsCustomPrompModalVisible ] = useState( false );
	const toogleShowCustomPromptModal = () => {
		setIsCustomPrompModalVisible( ! isCustomPrompModalVisible );
	};

	const blockProps = useBlockProps( {
		ref: blockRef,
		className: classNames( { 'is-waiting-response': wasCompletionJustRequested } ),
	} );

	const innerBlocks = useInnerBlocksProps( blockProps );

	return (
		<KeyboardShortcuts
			bindGlobal
			shortcuts={ {
				esc: () => {
					if ( [ 'requesting', 'suggesting' ].includes( requestingState ) ) {
						handleStopSuggestion();
					}
				},
			} }
		>
			<div { ...blockProps }>
				{ errorData?.message && ! errorDismissed && errorData?.code !== 'error_quota_exceeded' && (
					<Notice
						status={ errorData.status }
						isDismissible={ false }
						className="jetpack-ai-assistant__error"
					>
						{ errorData.message }
					</Notice>
				) }

				{ contentIsLoaded && ! useGutenbergSyntax && (
					<div className="jetpack-ai-assistant__content">
						<RawHTML>{ markdownConverter.render( attributes.content ) }</RawHTML>
					</div>
				) }

				{ contentIsLoaded && useGutenbergSyntax && (
					<div
						className="jetpack-ai-assistant__content is-layout-building-mode"
						{ ...innerBlocks }
					/>
				) }
				<InspectorControls>
					<PanelBody initialOpen={ true }>
						<PanelRow>
							<UsagePanel placement={ USAGE_PANEL_PLACEMENT_BLOCK_SETTINGS_SIDEBAR } />
						</PanelRow>
					</PanelBody>
					<PanelBody initialOpen={ true }>
						<PanelRow>
							<FeedbackControl />
						</PanelRow>
					</PanelBody>
				</InspectorControls>

				{ isPlaygroundVisible && (
					<InspectorControls>
						<PanelBody title={ __( 'AI Playground', 'jetpack' ) } initialOpen={ true }>
							<PanelRow>
								<ToggleControl
									label={ __( 'Gutenberg Syntax', 'jetpack' ) }
									onChange={ check => setAttributes( { useGutenbergSyntax: check } ) }
									checked={ attributes.useGutenbergSyntax }
								/>
							</PanelRow>
							<PanelRow>
								<ToggleControl
									label={ __( 'GPT-4', 'jetpack' ) }
									onChange={ check => setAttributes( { useGpt4: check } ) }
									checked={ attributes.useGpt4 }
								/>
							</PanelRow>
							<PanelRow>
								{ isCustomPrompModalVisible && (
									<Modal
										title={ __( 'Custom System Prompt', 'jetpack' ) }
										onRequestClose={ toogleShowCustomPromptModal }
									>
										<TextareaControl
											rows={ 20 }
											label={ __( 'Set up the custom system prompt ', 'jetpack' ) }
											onChange={ value => setAttributes( { customSystemPrompt: value } ) }
											className="jetpack-ai-assistant__custom-prompt"
											value={
												attributes.customSystemPrompt ||
												getInitialSystemPrompt( {
													useGutenbergSyntax: attributes.useGutenbergSyntax,
													useGpt4: attributes.useGpt4,
												} )?.content
											}
										/>
										<div className="jetpack-ai-assistant__custom-prompt__footer">
											<Button
												onClick={ () => setAttributes( { customSystemPrompt: '' } ) }
												variant="secondary"
											>
												{ __( 'Restore the prompt', 'jetpack' ) }
											</Button>

											<Button onClick={ toogleShowCustomPromptModal } variant="secondary">
												{ __( 'Close', 'jetpack' ) }
											</Button>
										</div>
									</Modal>
								) }
								<Button onClick={ toogleShowCustomPromptModal } variant="secondary">
									{ __( 'Set system custom prompt', 'jetpack' ) }
								</Button>
							</PanelRow>
						</PanelBody>
					</InspectorControls>
				) }

				{ isOverLimit && isSelected && <UpgradePrompt /> }
				{ ! connected && <ConnectPrompt /> }
				{ ! isWaitingState && connected && ! requireUpgrade && (
					<ToolbarControls
						isWaitingState={ isWaitingState }
						contentIsLoaded={ contentIsLoaded }
						getSuggestionFromOpenAI={ getSuggestionFromOpenAI }
						retryRequest={ retryRequest }
						handleAcceptContent={ handleAcceptContent }
						handleAcceptTitle={ handleAcceptTitle }
						handleGetSuggestion={ handleGetSuggestion }
						handleImageRequest={ handleImageRequest }
						handleTryAgain={ handleTryAgain }
						showRetry={ showRetry }
						contentBefore={ contentBefore }
						hasPostTitle={ !! postTitle?.length }
						wholeContent={ wholeContent }
						promptType={ attributes.promptType }
						setUserPrompt={ prompt => {
							if ( ! aiControlRef?.current ) {
								return;
							}

							const userPromptInput = aiControlRef.current;

							// Focus the text area
							userPromptInput.focus();

							// Add a typing effect in the text area
							for ( let i = 0; i < prompt.length; i++ ) {
								setTimeout( () => {
									setUserPrompt( prompt.slice( 0, i + 1 ) );
								}, 25 * i );
							}
						} }
						recordEvent={ tracks.recordEvent }
						isGeneratingTitle={ isGeneratingTitle }
					/>
				) }
				<AIControl
					ref={ aiControlRef }
					disabled={ requireUpgrade || ! connected }
					value={ userPrompt }
					placeholder={ promptPlaceholder || __( 'Ask Jetpack AI', 'jetpack' ) }
					onChange={ handleChange }
					onSend={ handleSend }
					onStop={ handleStopSuggestion }
					onAccept={ handleAccept }
					state={ requestingState }
					isTransparent={ requireUpgrade || ! connected }
					showButtonLabels={ ! isMobileViewport }
					showAccept={ contentIsLoaded && ! isWaitingState }
					acceptLabel={ acceptLabel }
					showClearButton={ ! isWaitingState }
					showGuideLine={ contentIsLoaded }
				/>

				{ ! loadingImages && resultImages.length > 0 && (
					<Flex direction="column" style={ { width: '100%' } }>
						<FlexBlock
							style={ { textAlign: 'center', margin: '12px', fontStyle: 'italic', width: '100%' } }
						>
							{ attributes.requestedPrompt }
						</FlexBlock>
						<FlexBlock style={ { fontSize: '20px', lineHeight: '38px' } }>
							{ __( 'Please choose your image', 'jetpack' ) }
						</FlexBlock>
						<Flex direction="row" wrap={ true }>
							{ resultImages.map( image => (
								<ImageWithSelect
									setImageModal={ setImageModal }
									saveImage={ saveImage }
									image={ image }
									key={ image }
								/>
							) ) }
						</Flex>
					</Flex>
				) }

				{ ! loadingImages && imageModal && (
					<Modal onRequestClose={ () => setImageModal( null ) }>
						<ImageWithSelect
							saveImage={ saveImage }
							setImageModal={ setImageModal }
							image={ imageModal }
							inModal={ true }
						/>
					</Modal>
				) }
			</div>
		</KeyboardShortcuts>
	);
}
