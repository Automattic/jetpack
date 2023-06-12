/**
 * External dependencies
 */
import { useAnalytics } from '@automattic/jetpack-shared-extension-utils';
import { useBlockProps, store as blockEditorStore } from '@wordpress/block-editor';
import { rawHandler, createBlock } from '@wordpress/blocks';
import { Flex, FlexBlock, Modal, Notice } from '@wordpress/components';
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
import AIControl from './ai-control';
import useAIFeature from './hooks/use-ai-feature';
import ImageWithSelect from './image-with-select';
import { getImagesFromOpenAI } from './lib';
import useSuggestionsFromOpenAI from './use-suggestions-from-openai';
import './editor.scss';

const markdownConverter = new MarkdownIt( {
	breaks: true,
} );

const isInBlockEditor = window?.Jetpack_Editor_Initial_State?.screenBase === 'post';

export default function AIAssistantEdit( { attributes, setAttributes, clientId } ) {
	const [ userPrompt, setUserPrompt ] = useState();
	const [ errorData, setError ] = useState( {} );
	const [ loadingImages, setLoadingImages ] = useState( false );
	const [ resultImages, setResultImages ] = useState( [] );
	const [ imageModal, setImageModal ] = useState( null );
	const [ errorDismissed, setErrorDismissed ] = useState( null );
	const { tracks } = useAnalytics();
	const postId = useSelect( select => select( 'core/editor' ).getCurrentPostId() );
	const aiControlRef = useRef( null );
	const blockRef = useRef( null );

	const { replaceBlocks, replaceBlock, removeBlock } = useDispatch( blockEditorStore );
	const { editPost } = useDispatch( 'core/editor' );
	const { mediaUpload } = useSelect( select => {
		const { getSettings } = select( blockEditorStore );
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
		const newContentBlocks = rawHandler( { HTML: markdownConverter.render( attributes.content ) } );
		await replaceBlocks( clientId, newContentBlocks );

		const lastEditableElement = getLastEditableElement( newContentBlocks );

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
		setAttributes( { content: undefined, promptType: undefined } );
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

	return (
		<div
			{ ...useBlockProps( {
				ref: blockRef,
				className: classNames( { 'is-waiting-response': wasCompletionJustRequested } ),
			} ) }
		>
			{ errorData?.message && ! errorDismissed && errorData?.code !== 'error_quota_exceeded' && (
				<Notice
					status={ errorData.status }
					isDismissible={ false }
					className="jetpack-ai-assistant__error"
				>
					{ errorData.message }
				</Notice>
			) }
			{ contentIsLoaded && (
				<>
					<div className="jetpack-ai-assistant__content">
						<RawHTML>{ markdownConverter.render( attributes.content ) }</RawHTML>
					</div>
				</>
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
