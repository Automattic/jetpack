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
		path: '/wpcom/v2/coauthor/images/generations',
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
		.catch( res => {
			// We have not yet submitted a token.
			if ( res.code === 'token_missing' ) {
				setErrorMessage( 'Please visit settings and input valid OpenAI token' );
				setLoadingImages( false );
			}
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
				<Placeholder label={ 'Coauthor Image' } notices={ [ <div>{ errorMessage }</div> ] }>
					<TextareaControl
						label="What would you like to see?"
						value={ prompt }
						onChange={ setPrompt }
					/>
					<Flex direction="row">
						<FlexItem>
							<Button
								isPrimary
								onClick={ () => {
									setErrorMessage( '' );
									submit();
								} }
							>
								{ 'Retry' }
							</Button>
						</FlexItem>
						{ errorMessage === 'Please visit settings and input valid OpenAI token' && (
							<FlexItem>
								<Button href="options-general.php?page=coauthor" target="_blank">
									{ 'Visit Coauthor Settings' }
								</Button>
							</FlexItem>
						) }
					</Flex>
				</Placeholder>
			) }
			{ ! errorMessage && ! attributes.requestedPrompt && (
				<Placeholder label={ 'Coauthor Image' }>
					<div>
						<TextareaControl label="What would you like to see?" onChange={ setPrompt } />
						<Button isPrimary onClick={ submit }>
							{ 'Submit' }
						</Button>
					</div>
				</Placeholder>
			) }
			{ ! errorMessage && ! loadingImages && resultImages.length > 0 && (
				<Placeholder label={ 'Coauthor Image' }>
					<div>
						<div style={ { textAlign: 'center', margin: '12px', fontStyle: 'italic' } }>
							{ attributes.requestedPrompt }
						</div>
						<div style={ { fontSize: '20px', lineHeight: '38px' } }>
							{ 'Please choose your image' }
						</div>
						<Flex direction="row" justify={ 'space-between' }>
							{ resultImages.map( image => (
								<FlexBlock key={ image }>
									<img
										className="wp-block-coauthor-image-image"
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
											const file = new File( [ blob ], 'coauthor_image.png', {
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
				<Placeholder label={ 'Coauthor Image' }>
					<div>
						<div className="content">{ attributes.content }</div>
					</div>
				</Placeholder>
			) }
			{ ! errorMessage && loadingImages && (
				<Placeholder label={ 'Coauthor Image' }>
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
