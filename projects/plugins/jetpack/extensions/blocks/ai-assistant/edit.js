/**
 * External dependencies
 */
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
} from '@wordpress/components';
import { useKeyboardShortcut } from '@wordpress/compose';
import { useSelect, useDispatch } from '@wordpress/data';
import { RawHTML, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import classNames from 'classnames';
import MarkdownIt from 'markdown-it';
import { useEffect, useRef } from 'react';
/**
 * Internal dependencies
 */
import AIControl from './components/ai-control';
import ImageWithSelect from './components/image-with-select';
import useAIFeature from './hooks/use-ai-feature';
import useSuggestionsFromOpenAI from './hooks/use-suggestions-from-openai';
import { getImagesFromOpenAI } from './lib/image';
import { getInitialSystemPrompt } from './lib/prompt';
import './editor.scss';

const markdownConverter = new MarkdownIt( {
	breaks: true,
} );

const isInBlockEditor = window?.Jetpack_Editor_Initial_State?.screenBase === 'post';
const isPlaygroundVisible =
	window?.Jetpack_Editor_Initial_State?.[ 'ai-assistant' ]?.[ 'is-playground-visible' ];

export default function AIAssistantEdit( { attributes, setAttributes, clientId } ) {
	const [ userPrompt, setUserPrompt ] = useState();
	const [ errorData, setError ] = useState( {} );
	const [ loadingImages, setLoadingImages ] = useState( false );
	const [ resultImages, setResultImages ] = useState( [] );
	const [ imageModal, setImageModal ] = useState( null );
	const [ errorDismissed, setErrorDismissed ] = useState( null );
	const { tracks } = useAnalytics();
	const postId = useSelect( select => select( 'core/editor' ).getCurrentPostId() );

	const getBlock = useSelect(
		select => () => select( 'core/block-editor' ).getBlock( clientId ),
		[ clientId ]
	);

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

	const focusOnPrompt = () => {
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

	const { requireUpgrade, refresh: refreshFeatureData } = useAIFeature();

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
	} = useSuggestionsFromOpenAI( {
		onSuggestionDone: focusOnPrompt,
		onUnclearPrompt: focusOnPrompt,
		onModeration: focusOnPrompt,
		attributes,
		clientId,
		content: attributes.content,
		setError,
		tracks,
		userPrompt,
		refreshFeatureData,
		requireUpgrade,
	} );

	useEffect( () => {
		if ( errorData ) {
			setErrorDismissed( false );
		}
	}, [ errorData ] );

	/*
	 * Populate the block with inner blocks if:
	 * - It's the first time the block is rendered
	 * - The block doesn't have children blocks
	 * - The `content` attribute contains contains blocks definition
	 */
	const initialContent = useRef( attributes?.content );
	useEffect( () => {
		if ( ! initialContent?.current?.length ) {
			return;
		}

		const block = getBlock();
		if ( block?.innerBlocks?.length ) {
			return;
		}

		const storedInnerBlocks = parse( initialContent.current );
		if ( ! storedInnerBlocks?.length ) {
			return;
		}

		// Populate block inner blocks
		replaceBlocks( clientId, storedInnerBlocks );
	}, [ initialContent, clientId, replaceBlocks, getBlock ] );

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

	const moveCaretToEnd = element => {
		const selection = window.getSelection();
		selection.selectAllChildren( element );
		selection.collapseToEnd();
		element.focus();
	};

	const handleAcceptContent = async () => {
		let newGeneratedBlocks = [];
		if ( ! useGutenbergSyntax ) {
			/*
			 * Markdown-syntax content
			 * - Get HTML code from markdown content
			 * - Create blocks from HTML code
			 */
			newGeneratedBlocks = rawHandler( {
				HTML: markdownConverter.render( attributes.content ),
			} );
		} else {
			/*
			 * Gutenberg-syntax content
			 * - Blocks are already created
			 * - blocks are children of the current block
			 */
			newGeneratedBlocks = getBlock();
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

	const handleGetSuggestion = ( ...args ) => {
		getSuggestionFromOpenAI( ...args );
		focusOnBlock();
		return;
	};

	const handleStopSuggestion = () => {
		stopSuggestion();
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

	useKeyboardShortcut(
		'esc',
		e => {
			e.stopImmediatePropagation();
			handleStopSuggestion();
			focusOnPrompt();
		},
		{
			target: blockRef,
		}
	);

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
				<div className="jetpack-ai-assistant__content is-layout-building-mode" { ...innerBlocks } />
			) }

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

			<AIControl
				ref={ aiControlRef }
				content={ attributes.content }
				contentIsLoaded={ contentIsLoaded }
				getSuggestionFromOpenAI={ handleGetSuggestion }
				retryRequest={ retryRequest }
				handleAcceptContent={ handleAcceptContent }
				handleAcceptTitle={ handleAcceptTitle }
				handleGetSuggestion={ handleGetSuggestion }
				handleStopSuggestion={ handleStopSuggestion }
				handleImageRequest={ handleImageRequest }
				handleTryAgain={ handleTryAgain }
				isWaitingState={ isWaitingState }
				loadingImages={ loadingImages }
				showRetry={ showRetry }
				setUserPrompt={ setUserPrompt }
				contentBefore={ contentBefore }
				postTitle={ postTitle }
				userPrompt={ userPrompt }
				wholeContent={ wholeContent }
				promptType={ attributes.promptType }
				onChange={ () => setErrorDismissed( true ) }
				requireUpgrade={ errorData?.code === 'error_quota_exceeded' || requireUpgrade }
				recordEvent={ tracks.recordEvent }
				isGeneratingTitle={ attributes.promptType === 'generateTitle' }
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
	);
}
