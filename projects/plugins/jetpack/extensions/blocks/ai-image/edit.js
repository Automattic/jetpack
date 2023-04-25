import { useAnalytics } from '@automattic/jetpack-shared-extension-utils';
import apiFetch from '@wordpress/api-fetch';
import { useBlockProps, store as blockEditorStore } from '@wordpress/block-editor';
import { createBlock } from '@wordpress/blocks';
import {
	Button,
	Placeholder,
	TextareaControl,
	Flex,
	FlexBlock,
	FlexItem,
	Modal,
	Spinner,
} from '@wordpress/components';
import { useSelect, useDispatch } from '@wordpress/data';
import { useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { dalleExamplePrompts } from './dalle-example-prompts';

function getRandomItem( arr ) {
	// get random index value
	const randomIndex = Math.floor( Math.random() * arr.length );
	return arr[ randomIndex ];
}

function getImagesFromOpenAI(
	prompt,
	setAttributes,
	setLoadingImages,
	setResultImages,
	setErrorMessage,
	postId
) {
	setLoadingImages( true );
	setErrorMessage( null );
	setAttributes( { requestedPrompt: prompt } ); // This will prevent double submitting.

	apiFetch( {
		path: '/wpcom/v2/jetpack-ai/images/generations',
		method: 'POST',
		data: {
			prompt,
			post_id: postId,
		},
	} )
		.then( res => {
			setLoadingImages( false );
			const images = res.data.map( image => {
				return 'data:image/png;base64,' + image.b64_json;
			} );
			setResultImages( images );
		} )
		.catch( e => {
			if ( e.message ) {
				setErrorMessage( e.message ); // Message was already translated by the backend
			} else {
				setErrorMessage(
					__(
						'Whoops, we have encountered an error. AI is like really, really hard and this is an experimental feature. Please try again later.',
						'jetpack'
					)
				);
			}
			setLoadingImages( false );
		} );
}

/*eslint-disable jsx-a11y/no-noninteractive-element-interactions, jsx-a11y/click-events-have-key-events */
export default function Edit( { attributes, setAttributes, clientId } ) {
	const [ loadingImages, setLoadingImages ] = useState( false );
	const [ resultImages, setResultImages ] = useState( [] );
	const [ imageModal, setImageModal ] = useState( null );
	const [ prompt, setPrompt ] = useState( '' );
	const { replaceBlock } = useDispatch( blockEditorStore );
	const [ errorMessage, setErrorMessage ] = useState( null );
	const [ placeholder ] = useState( getRandomItem( dalleExamplePrompts ) );
	const errorButtonText = __( 'Retry', 'jetpack' );
	const successButtonText = __( 'Submit', 'jetpack' );
	const submitButtonText = errorMessage ? errorButtonText : successButtonText;
	const { tracks } = useAnalytics();

	const { mediaUpload } = useSelect( select => {
		const { getSettings } = select( blockEditorStore );
		const settings = getSettings();
		return {
			mediaUpload: settings.mediaUpload,
		};
	}, [] );
	const postId = useSelect( select => select( 'core/editor' ).getCurrentPostId() );

	const submit = () => {
		setLoadingImages( false );
		setResultImages( [] );
		setErrorMessage( null );
		getImagesFromOpenAI(
			prompt.trim() === '' ? placeholder : prompt,
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

	const ImageWithSelect = ( { image, inModal = false } ) => {
		return (
			<Flex direction="column">
				{ inModal && (
					<FlexItem style={ { 'text-align': 'center' } }>
						<Button variant="primary" onClick={ () => saveImage( image ) }>
							{ __( 'Use this image', 'jetpack' ) }
						</Button>
					</FlexItem>
				) }
				<FlexBlock>
					<img
						className="wp-block-ai-image-image"
						src={ image }
						alt=""
						onClick={ () => setImageModal( image ) }
					/>
				</FlexBlock>
				{ ! inModal && (
					<FlexBlock>
						<Flex direction="column" style={ { 'align-items': 'center' } }>
							<FlexItem>
								<Button variant="primary" onClick={ () => saveImage( image ) }>
									{ __( 'Use this image', 'jetpack' ) }
								</Button>
							</FlexItem>
						</Flex>
					</FlexBlock>
				) }
			</Flex>
		);
	};

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

	return (
		<div { ...useBlockProps() }>
			<Placeholder
				label={ __( 'AI Image', 'jetpack' ) }
				notices={ errorMessage && [ <div>{ errorMessage }</div> ] }
			>
				{ ! loadingImages && resultImages.length === 0 && (
					<Flex expanded={ true }>
						<FlexBlock>
							<TextareaControl
								label={ __( 'What would you like to see?', 'jetpack' ) }
								placeholder={ placeholder }
								allowedFormats={ [] }
								onChange={ setPrompt }
								rows={ 6 }
							/>
							<Button variant="primary" onClick={ submit }>
								{ submitButtonText }
							</Button>
						</FlexBlock>
					</Flex>
				) }
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
								<ImageWithSelect image={ image } />
							) ) }
						</Flex>
					</Flex>
				) }
				{ ! loadingImages && imageModal && (
					<Modal onRequestClose={ () => setImageModal( null ) }>
						<ImageWithSelect image={ imageModal } inModal={ true } />
					</Modal>
				) }
				{ attributes.content && <div className="content">{ attributes.content }</div> }
				{ loadingImages && (
					<FlexBlock style={ { padding: '10px', textAlign: 'center' } }>
						<Spinner
							style={ {
								height: 'calc(4px * 20)',
								width: 'calc(4px * 20)',
							} }
						/>
					</FlexBlock>
				) }
			</Placeholder>
		</div>
	);
}
