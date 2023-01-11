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
	Spinner,
} from '@wordpress/components';
import { useSelect, useDispatch } from '@wordpress/data';
import { useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

function getImagesFromOpenAI(
	prompt,
	setAttributes,
	setLoadingImages,
	setResultImages,
	setErrorMessage
) {
	setLoadingImages( true );
	setAttributes( { requestedPrompt: prompt } ); // This will prevent double submitting.

	apiFetch( {
		path: '/wpcom/v2/jetpack-ai/images/generations',
		method: 'POST',
		data: {
			prompt,
		},
	} )
		.then( res => {
			setLoadingImages( false );
			if ( res.error && res.error.message ) {
				setErrorMessage( res.error.message );
				return;
			}
			const images = res.data.map( image => {
				return 'data:image/png;base64,' + image.b64_json;
			} );
			setResultImages( images );
		} )
		.catch( () => {
			setErrorMessage(
				__(
					'Whoops, we have encountered an error. AI is like really, really hard and this is an experimental feature. Please try again later.',
					'jetpack'
				)
			);
			setLoadingImages( false );
		} );
}

/*eslint-disable jsx-a11y/no-noninteractive-element-interactions, jsx-a11y/click-events-have-key-events */
export default function Edit( { attributes, setAttributes, clientId } ) {
	const [ loadingImages, setLoadingImages ] = useState( false );
	const [ resultImages, setResultImages ] = useState( [] );
	const [ prompt, setPrompt ] = useState( '' );
	const { replaceBlock } = useDispatch( blockEditorStore );
	const [ errorMessage, setErrorMessage ] = useState( '' );

	const { mediaUpload } = useSelect( select => {
		const { getSettings } = select( blockEditorStore );
		const settings = getSettings();
		return {
			mediaUpload: settings.mediaUpload,
		};
	}, [] );

	const submit = () =>
		getImagesFromOpenAI(
			prompt,
			setAttributes,
			setLoadingImages,
			setResultImages,
			setErrorMessage
		);

	return (
		<div { ...useBlockProps() }>
			{ ! loadingImages && errorMessage && (
				<Placeholder
					label={ __( 'Jetpack AI Image', 'jetpack' ) }
					notices={ [ <div>{ errorMessage }</div> ] }
				>
					<TextareaControl
						label={ __( 'What would you like to see?', 'jetpack' ) }
						value={ prompt }
						onChange={ setPrompt }
					/>
					<Flex direction="row">
						<FlexItem>
							<Button
								variant="primary"
								onClick={ () => {
									setErrorMessage( '' );
									submit();
								} }
							>
								{ __( 'Retry', 'jetpack' ) }
							</Button>
						</FlexItem>
					</Flex>
				</Placeholder>
			) }
			{ ! errorMessage && ! attributes.requestedPrompt && (
				<Placeholder label={ __( 'Jetpack AI Image', 'jetpack' ) }>
					<div>
						<TextareaControl
							label={ __( 'What would you like to see?', 'jetpack' ) }
							onChange={ setPrompt }
						/>
						<Button variant="primary" onClick={ submit }>
							{ __( 'Submit', 'jetpack' ) }
						</Button>
					</div>
				</Placeholder>
			) }
			{ ! errorMessage && ! loadingImages && resultImages.length > 0 && (
				<Placeholder label={ __( 'Jetpack AI Image', 'jetpack' ) }>
					<div>
						<div style={ { textAlign: 'center', margin: '12px', fontStyle: 'italic' } }>
							{ attributes.requestedPrompt }
						</div>
						<div style={ { fontSize: '20px', lineHeight: '38px' } }>
							{ __( 'Please choose your image', 'jetpack' ) }
						</div>
						<Flex direction="row" justify={ 'space-between' }>
							{ resultImages.map( image => (
								<FlexBlock key={ image }>
									<img
										className="wp-block-ai-image-image"
										src={ image }
										alt=""
										onClick={ async () => {
											if ( loadingImages ) {
												return;
											}
											setLoadingImages( true );
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
										} }
									/>
								</FlexBlock>
							) ) }
						</Flex>
					</div>
				</Placeholder>
			) }
			{ ! errorMessage && attributes.content && ! loadingImages && (
				<Placeholder label={ __( 'Jetpack AI Image', 'jetpack' ) }>
					<div>
						<div className="content">{ attributes.content }</div>
					</div>
				</Placeholder>
			) }
			{ ! errorMessage && loadingImages && (
				<Placeholder label={ __( 'Jetpack AI Image', 'jetpack' ) }>
					<div style={ { padding: '10px', textAlign: 'center' } }>
						<Spinner
							style={ {
								height: 'calc(4px * 20)',
								width: 'calc(4px * 20)',
							} }
						/>
					</div>
				</Placeholder>
			) }
		</div>
	);
}
