/**
 * External dependencies
 */
import { useAnalytics } from '@automattic/jetpack-shared-extension-utils';
import { useBlockProps, store as blockEditorStore } from '@wordpress/block-editor';
import { rawHandler, createBlock } from '@wordpress/blocks';
import { Flex, FlexBlock, Modal } from '@wordpress/components';
import { useSelect, useDispatch } from '@wordpress/data';
import { useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
/**
 * Internal dependencies
 */
import AIControl from './ai-control';
import ImageWithSelect from './image-with-select';
import { getImagesFromOpenAI } from './lib';
import ShowLittleByLittle from './show-little-by-little';
import useSuggestionsFromOpenAI from './use-suggestions-from-openai';
import './editor.scss';

export default function Edit( { attributes, setAttributes, clientId } ) {
	const [ userPrompt, setUserPrompt ] = useState();
	const [ , setErrorMessage ] = useState( false );
	const [ aiType, setAiType ] = useState( 'text' );
	const [ animationDone, setAnimationDone ] = useState( false );
	const [ loadingImages, setLoadingImages ] = useState( false );
	const [ resultImages, setResultImages ] = useState( [] );
	const [ imageModal, setImageModal ] = useState( null );
	const { tracks } = useAnalytics();
	const postId = useSelect( select => select( 'core/editor' ).getCurrentPostId() );

	const { replaceBlocks, replaceBlock } = useDispatch( blockEditorStore );
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
		getSuggestionFromOpenAI,
		showRetry,
		contentBefore,
		postTitle,
	} = useSuggestionsFromOpenAI( {
		clientId,
		content: attributes.content,
		setAttributes,
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
		replaceBlocks( clientId, rawHandler( { HTML: attributes.content } ) );
	};

	const handleTryAgain = () => {
		setAttributes( { content: undefined } );
	};

	const placeholder =
		aiType === 'text'
			? __( 'Write a paragraph about …', 'jetpack' )
			: __( 'What would you like to see?', 'jetpack', /* dummy arg to avoid bad minification */ 0 );

	const handleGetSuggestion = () => {
		if ( aiType === 'text' ) {
			getSuggestionFromOpenAI();
			return;
		}

		setLoadingImages( false );
		setResultImages( [] );
		setErrorMessage( null );
		getImagesFromOpenAI(
			userPrompt.trim() === '' ? placeholder : userPrompt,
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
		<div { ...useBlockProps() }>
			{ contentIsLoaded && (
				<>
					<ShowLittleByLittle
						showAnimation={ ! animationDone }
						onAnimationDone={ () => {
							setAnimationDone( true );
						} }
						clientId={ clientId }
						html={ attributes.content }
					/>
				</>
			) }
			<AIControl
				aiType={ aiType }
				animationDone={ animationDone }
				content={ attributes.content }
				contentIsLoaded={ contentIsLoaded }
				getSuggestionFromOpenAI={ getSuggestionFromOpenAI }
				handleAcceptContent={ handleAcceptContent }
				handleGetSuggestion={ handleGetSuggestion }
				handleTryAgain={ handleTryAgain }
				isWaitingState={ isWaitingState }
				loadingImages={ loadingImages }
				placeholder={ placeholder }
				showRetry={ showRetry }
				setAiType={ setAiType }
				setUserPrompt={ setUserPrompt }
				contentBefore={ contentBefore }
				postTitle={ postTitle }
				userPrompt={ userPrompt }
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
