import './editor.scss';

import { useAnalytics } from '@automattic/jetpack-shared-extension-utils';
import apiFetch from '@wordpress/api-fetch';
import { useBlockProps, store as blockEditorStore } from '@wordpress/block-editor';
import { rawHandler, createBlock } from '@wordpress/blocks';
import {
	Button,
	DropdownMenu,
	Flex,
	FlexBlock,
	FlexItem,
	Modal,
	TextareaControl,
	// eslint-disable-next-line wpcalypso/no-unsafe-wp-apis
	__experimentalToggleGroupControl as ToggleGroupControl,
	// eslint-disable-next-line wpcalypso/no-unsafe-wp-apis
	__experimentalToggleGroupControlOption as ToggleGroupControlOption,
} from '@wordpress/components';
import { useSelect, useDispatch } from '@wordpress/data';
import { useState, RawHTML, useEffect } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';
import { Icon, pencil, moreVertical } from '@wordpress/icons';
import MarkdownIt from 'markdown-it';
import Loading from './loading';

// Maximum number of characters we send from the content
export const MAXIMUM_NUMBER_OF_CHARACTERS_SENT_FROM_CONTENT = 1024;

// Creates the prompt that will eventually be sent to OpenAI. It uses the current post title, content (before the actual AI block) - or a slice of it if too long, and tags + categories names
export const createPrompt = (
	postTitle = '',
	contentBeforeCurrentBlock = [],
	categoriesNames = '',
	tagsNames = '',
	userPrompt = '',
	type = 'userPrompt'
) => {
	const promptSuffix = __(
		'. Please always output the generated content in markdown format. Do not include a top level heading by default. Please only output generated content ready for publishing.',
		'jetpack'
	);

	if ( type === 'userPrompt' ) {
		return userPrompt + promptSuffix;
	}

	if ( type === 'titleSummary' ) {
		const titlePrompt = sprintf(
			/** translators: This will be the beginning of a prompt that will be sent to OpenAI based on the post title. */
			__( "Please help me write a short piece of a blog post titled '%1$s'", 'jetpack' ),
			postTitle
		);
		return titlePrompt + promptSuffix;
	}

	if ( type === 'expandPreceding' ) {
		const content = contentBeforeCurrentBlock
			.filter( function ( block ) {
				return block && block.attributes && block.attributes.content;
			} )
			.map( function ( block ) {
				return block.attributes.content.replaceAll( '<br/>', '\n' );
			} )
			.join( '\n' );
		const shorter_content = content.slice( -1 * MAXIMUM_NUMBER_OF_CHARACTERS_SENT_FROM_CONTENT );

		const expandPrompt = sprintf(
			/** translators: This will be the end of a prompt that will be sent to OpenAI with the last MAXIMUM_NUMBER_OF_CHARACTERS_SENT_FROM_CONTENT characters of content.*/
			__( ' Please continue from here:\n\n … %s', 'jetpack' ), // eslint-disable-line @wordpress/i18n-no-collapsible-whitespace
			shorter_content
		);
		return expandPrompt + promptSuffix;
	}

	// We prevent a prompt if everything is empty.
	// if ( ! postTitle && ! shorter_content && ! categoriesNames && ! tagsNames && ! userPrompt ) {
	// 	return false;
	// }

	// if ( categoriesNames ) {
	// 	/** translators: This will be the follow up of a prompt that will be sent to OpenAI based on comma-seperated category names. */
	// 	prompt += sprintf( __( ", published in categories '%1$s'", 'jetpack' ), categoriesNames );
	// }

	// if ( tagsNames ) {
	// 	/** translators: This will be the follow up of a prompt that will be sent to OpenAI based on comma-seperated category names. */
	// 	prompt += sprintf( __( " and tagged '%1$s'", 'jetpack' ), tagsNames );
	// }

	// return prompt.trim();
};

// This component displays the text word by word if show animation is true
function ShowLittleByLittle( { html, showAnimation, onAnimationDone } ) {
	// This is the HTML to be displayed.
	const [ displayedRawHTML, setDisplayedRawHTML ] = useState( '' );

	useEffect(
		() => {
			// That will only happen once
			if ( showAnimation ) {
				// This is to animate text input. I think this will give an idea of a "better" AI.
				// At this point this is an established pattern.
				const tokens = html.split( ' ' );
				for ( let i = 1; i < tokens.length; i++ ) {
					const output = tokens.slice( 0, i ).join( ' ' );
					setTimeout( () => setDisplayedRawHTML( output ), 50 * i );
				}
				setTimeout( () => {
					setDisplayedRawHTML( html );
					onAnimationDone();
				}, 50 * tokens.length );
			} else {
				setDisplayedRawHTML( html );
			}
		},
		// eslint-disable-next-line
		[]
	);
	return (
		<div className="jetpack-ai-assistant__content">
			<RawHTML>{ displayedRawHTML }</RawHTML>
		</div>
	);
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

export default function Edit( { attributes, setAttributes, clientId } ) {
	const [ isLoadingCompletion, setIsLoadingCompletion ] = useState( false );
	const [ isLoadingCategories, setIsLoadingCategories ] = useState( false );
	const [ needsMoreCharacters, setNeedsMoreCharacters ] = useState( false );
	const [ userPrompt, setUserPrompt ] = useState();
	const [ showRetry, setShowRetry ] = useState( false );
	const [ errorMessage, setErrorMessage ] = useState( false );
	const [ aiType, setAiType ] = useState( 'text' );
	const [ loadingImages, setLoadingImages ] = useState( false );
	const [ resultImages, setResultImages ] = useState( [] );
	const [ imageModal, setImageModal ] = useState( null );
	const { tracks } = useAnalytics();

	const { replaceBlocks, replaceBlock } = useDispatch( blockEditorStore );
	const { mediaUpload } = useSelect( select => {
		const { getSettings } = select( blockEditorStore );
		const settings = getSettings();
		return {
			mediaUpload: settings.mediaUpload,
		};
	}, [] );

	// Let's grab post data so that we can do something smart.
	const currentPostTitle = useSelect( select =>
		select( 'core/editor' ).getEditedPostAttribute( 'title' )
	);

	let loading = false;
	const categories =
		useSelect( select => select( 'core/editor' ).getEditedPostAttribute( 'categories' ) ) || [];

	const categoryObjects = useSelect(
		select => {
			return categories
				.map( categoryId => {
					const category = select( 'core' ).getEntityRecord( 'taxonomy', 'category', categoryId );

					if ( ! category ) {
						// Data is not yet loaded
						loading = true;
						return;
					}

					return category;
				} )
				.filter( Boolean ); // Remove undefined values
		},
		[ categories ]
	);

	const tags =
		useSelect( select => select( 'core/editor' ).getEditedPostAttribute( 'tags' ), [] ) || [];

	const tagObjects = useSelect(
		select => {
			return tags
				.map( tagId => {
					const tag = select( 'core' ).getEntityRecord( 'taxonomy', 'post_tag', tagId );

					if ( ! tag ) {
						// Data is not yet loaded
						loading = true;
						return;
					}

					return tag;
				} )
				.filter( Boolean ); // Remove undefined values
		},
		[ tags ]
	);

	useEffect( () => {
		setIsLoadingCategories( loading );
	}, [ loading ] );

	const postId = useSelect( select => select( 'core/editor' ).getCurrentPostId() );
	const categoryNames = categoryObjects
		.filter( cat => cat.id !== 1 )
		.map( ( { name } ) => name )
		.join( ', ' );
	const tagNames = tagObjects.map( ( { name } ) => name ).join( ', ' );

	const contentBefore = useSelect( select => {
		const editor = select( 'core/block-editor' );
		const index = editor.getBlockIndex( clientId );
		return editor.getBlocks().slice( 0, index ) ?? [];
	} );

	const getSuggestionFromOpenAI = type => {
		if ( !! attributes.content || isLoadingCompletion ) {
			return;
		}

		setShowRetry( false );
		setErrorMessage( false );
		setNeedsMoreCharacters( false );
		setIsLoadingCompletion( true );

		const data = {
			content: createPrompt(
				currentPostTitle,
				contentBefore,
				categoryNames,
				tagNames,
				userPrompt,
				type
			),
		};

		tracks.recordEvent( 'jetpack_ai_gpt3_completion', {
			post_id: postId,
		} );

		apiFetch( {
			path: '/wpcom/v2/jetpack-ai/completions',
			method: 'POST',
			data: data,
		} )
			.then( res => {
				const result = res.trim();
				const markdownConverter = new MarkdownIt();
				setAttributes( { content: result.length ? markdownConverter.render( result ) : '' } );
				setIsLoadingCompletion( false );
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
				setShowRetry( true );
				setIsLoadingCompletion( false );
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

	// Waiting state means there is nothing to be done until it resolves
	const isWaitingState = isLoadingCompletion || isLoadingCategories;
	// Content is loaded
	const contentIsLoaded = !! attributes.content;

	const handleAcceptContent = () => {
		replaceBlocks( clientId, rawHandler( { HTML: attributes.content } ) );
	};

	const retry = () => {
		setAttributes( { content: undefined } );
	};

	const placeholder =
		aiType === 'text'
			? __( 'Write a paragraph about …', 'jetpack' )
			: __( 'What would you like to see?', 'jetpack' );

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
			{ ! contentIsLoaded && (
				<div>
					{ showRetry && (
						<Button variant="primary" onClick={ () => handleGetSuggestion() }>
							{ __( 'Retry', 'jetpack' ) }
						</Button>
					) }
					<div className="jetpack-ai-assistant__input-wrapper">
						<TextareaControl
							onChange={ value => setUserPrompt( value ) }
							rows="1"
							placeholder={ placeholder }
							className="jetpack-ai-assistant__input"
						/>
						<ToggleGroupControl
							__nextHasNoMarginBottom={ true }
							label={ __( 'Type of AI assistance needed', 'jetpack' ) }
							hideLabelFromVision
							value={ aiType }
							onChange={ newType => setAiType( newType ) }
							isBlock
							size="2"
							className="jetpack-ai-assistant__input-toggle"
						>
							<ToggleGroupControlOption value="text" label={ __( 'Text', 'jetpack' ) } />
							<ToggleGroupControlOption value="image" label={ __( 'Images', 'jetpack' ) } />
						</ToggleGroupControl>
					</div>
					<div className="jetpack-ai-assistant__controls">
						<Button
							variant="primary"
							onClick={ () => handleGetSuggestion() }
							disabled={ isWaitingState }
							label={ __( 'Do some magic!', 'jetpack' ) }
						>
							<Icon icon={ pencil } />
						</Button>
						{ aiType === 'text' && (
							<DropdownMenu
								icon={ moreVertical }
								label={ __( 'Other options', 'jetpack' ) }
								controls={ [
									{
										title: __( 'Write a summary based on title', 'jetpack' ),
										onClick: () => getSuggestionFromOpenAI( 'titleSummary' ),
										isDisabled: isWaitingState,
									},
									{
										title: __( 'Expand on preceding content', 'jetpack' ),
										onClick: () => getSuggestionFromOpenAI( 'expandPreceding' ),
										isDisabled: isWaitingState,
									},
								] }
							/>
						) }
						{ ( ( ! attributes.content && isWaitingState ) || loadingImages ) && <Loading /> }
					</div>
				</div>
			) }

			{ contentIsLoaded && (
				<>
					<ShowLittleByLittle
						showAnimation={ ! attributes.animationDone }
						onAnimationDone={ () => {
							setAttributes( { animationDone: true } );
						} }
						clientId={ clientId }
						html={ attributes.content }
					/>
					{ contentIsLoaded && attributes.animationDone && (
						<div className="jetpack-ai-assistant__accept">
							<Button variant="primary" onClick={ handleAcceptContent }>
								{ __( 'Accept', 'jetpack' ) }
							</Button>
							<Button onClick={ retry }>{ __( 'Retry', 'jetpack' ) }</Button>
						</div>
					) }
				</>
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
		</div>
	);
}
