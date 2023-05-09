/**
 * External dependencies
 */
import { useAnalytics } from '@automattic/jetpack-shared-extension-utils';
import { useBlockProps, store as blockEditorStore } from '@wordpress/block-editor';
import { rawHandler, createBlock } from '@wordpress/blocks';
import { Flex, FlexBlock, Modal } from '@wordpress/components';
import { useSelect, useDispatch } from '@wordpress/data';
import { useState } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';
/**
 * Internal dependencies
 */
import AIControl from './ai-control';
import ImageWithSelect from './image-with-select';
import { getImagesFromOpenAI } from './lib';
import ShowLittleByLittle from './show-little-by-little';
import useSuggestionsFromOpenAI from './use-suggestions-from-openai';
import './editor.scss';

// Maximum number of characters we send from the content
export const MAXIMUM_NUMBER_OF_CHARACTERS_SENT_FROM_CONTENT = 1024;
export const PROMPT_SUFFIX = __(
	'. Please always output the generated content in markdown format. Do not include a top level heading by default. Please only output generated content ready for publishing.',
	'jetpack'
);

/*
 * Creates the prompt that will eventually be sent to OpenAI.
 * It uses the current post title, content (before the actual AI block)
 * - or a slice of it if too long, and tags + categories names
 * to create a prompt.
 *
 * @param {string} postTitle                - The current post title.
 * @param {Array} contentBeforeCurrentBlock - The content before the current block.
 * @param {string} categoriesNames          - The categories names.
 * @param {string} tagsNames                - The tags names.
 * @param {string} userPrompt               - The user prompt.
 * @param {string} type                     - The type of prompt to create.
 *
 * @return {string} The prompt.
 */
export const createPrompt = (
	postTitle = '',
	contentBeforeCurrentBlock = [],
	// eslint-disable-next-line no-unused-vars
	categoriesNames = '',
	// eslint-disable-next-line no-unused-vars
	tagsNames = '',
	userPrompt = '',
	type = 'userPrompt'
) => {
	if ( ! postTitle?.length ) {
		return '';
	}

	if ( type === 'userPrompt' ) {
		return userPrompt + PROMPT_SUFFIX;
	}

	if ( type === 'titleSummary' ) {
		const titlePrompt = sprintf(
			/** translators: This will be the beginning of a prompt that will be sent to OpenAI based on the post title. */
			__( "Please help me write a short piece of a blog post titled '%1$s'", 'jetpack' ),
			postTitle
		);

		return titlePrompt + PROMPT_SUFFIX;
	}

	if ( type === 'summarize' ) {
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
			__( 'Summarize this:\n\n … %s', 'jetpack' ), // eslint-disable-line @wordpress/i18n-no-collapsible-whitespace
			shorter_content
		);

		return expandPrompt + PROMPT_SUFFIX;
	}

	if ( type === 'continue' ) {
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

		return expandPrompt + PROMPT_SUFFIX;
	}

	// TODO: add some error handling if user supplied prompts or existing content is too short.

	// We prevent a prompt if everything is empty.
	// if ( ! postTitle && ! shorter_content && ! categoriesNames && ! tagsNames && ! userPrompt ) {
	// 	return false;
	// }

	// TODO: decide if we want to use categories and tags in the prompt now that user is supplying their own prompt default.
	// The following was copied over from the AI Paragraph block.

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

	const { isLoadingCategories, isLoadingCompletion, getSuggestionFromOpenAI, showRetry } =
		useSuggestionsFromOpenAI( {
			clientId,
			content: attributes.content,
			createPrompt,
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

	const retry = () => {
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
				isWaitingState={ isWaitingState }
				loadingImages={ loadingImages }
				placeholder={ placeholder }
				retry={ retry }
				showRetry={ showRetry }
				setAiType={ setAiType }
				setUserPrompt={ setUserPrompt }
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
