/**
 * External dependencies
 */
import { useAnalytics } from '@automattic/jetpack-shared-extension-utils';
import { useBlockProps, store as blockEditorStore } from '@wordpress/block-editor';
import { rawHandler, createBlock } from '@wordpress/blocks';
import { Flex, FlexBlock, Modal } from '@wordpress/components';
import { useSelect, useDispatch } from '@wordpress/data';
import { RawHTML, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import classNames from 'classnames';
import MarkdownIt from 'markdown-it';
/**
 * Internal dependencies
 */
import AIControl from './ai-control';
import ImageWithSelect from './image-with-select';
import { getImagesFromOpenAI } from './lib';
import useSuggestionsFromOpenAI from './use-suggestions-from-openai';
import './editor.scss';

const markdownConverter = new MarkdownIt( {
	breaks: true,
} );

export default function AIAssistantEdit( { attributes, setAttributes, clientId } ) {
	const [ userPrompt, setUserPrompt ] = useState();
	const [ errorMessage, setErrorMessage ] = useState( false );
	const [ loadingImages, setLoadingImages ] = useState( false );
	const [ resultImages, setResultImages ] = useState( [] );
	const [ imageModal, setImageModal ] = useState( null );
	const { tracks } = useAnalytics();
	const postId = useSelect( select => select( 'core/editor' ).getCurrentPostId() );

	const { replaceBlocks, replaceBlock, removeBlock } = useDispatch( blockEditorStore );
	const { editPost } = useDispatch( 'core/editor' );
	const { mediaUpload } = useSelect( select => {
		const { getSettings } = select( blockEditorStore );
		const settings = getSettings();
		return {
			mediaUpload: settings.mediaUpload,
		};
	}, [] );

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
		attributes,
		clientId,
		content: attributes.content,
		setErrorMessage,
		tracks,
		userPrompt,
	} );

	const saveImage = async image => {
		if ( loadingImages ) {
			return;
		}
		setLoadingImages( true );
		setErrorMessage( null );

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

	const handleAcceptContent = () => {
		replaceBlocks(
			clientId,
			rawHandler( { HTML: markdownConverter.render( attributes.content ) } )
		);
	};

	const handleAcceptTitle = () => {
		editPost( { title: attributes.content.trim() } );
		removeBlock( clientId );
	};

	const handleTryAgain = () => {
		setAttributes( { content: undefined } );
	};

	const handleGetSuggestion = type => {
		getSuggestionFromOpenAI( type );
		return;
	};

	const handleStopSuggestion = () => {
		stopSuggestion();
	};

	const handleImageRequest = () => {
		setResultImages( [] );
		setErrorMessage( null );

		getImagesFromOpenAI(
			userPrompt.trim() === '' ? __( 'What would you like to see?', 'jetpack' ) : userPrompt,
			setAttributes,
			setLoadingImages,
			setResultImages,
			setErrorMessage,
			postId
		);

		tracks.recordEvent( 'jetpack_ai_dalle_generation', {
			post_id: postId,
		} );
	};

	return (
		<div
			{ ...useBlockProps( {
				className: classNames( { 'is-waiting-response': wasCompletionJustRequested } ),
			} ) }
		>
			{ contentIsLoaded && (
				<>
					<div className="jetpack-ai-assistant__content">
						<RawHTML>{ markdownConverter.render( attributes.content ) }</RawHTML>
					</div>
				</>
			) }
			<AIControl
				content={ attributes.content }
				contentIsLoaded={ contentIsLoaded }
				getSuggestionFromOpenAI={ getSuggestionFromOpenAI }
				errorMessage={ errorMessage }
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
