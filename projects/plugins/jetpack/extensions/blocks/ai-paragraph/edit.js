import './editor.scss';

import { useAnalytics } from '@automattic/jetpack-shared-extension-utils';
import apiFetch from '@wordpress/api-fetch';
import { useBlockProps, RichText } from '@wordpress/block-editor';
import { Placeholder, Button, Spinner } from '@wordpress/components';
import { useSelect } from '@wordpress/data';
import { useState, useEffect } from '@wordpress/element';
import { sprintf, __ } from '@wordpress/i18n';
import { name as aiParagraphBlockName } from './index';

// Minimum number of characters needed in the prompt to send it to the backend
const NUMBER_OF_CHARACTERS_NEEDED = 36;

// Maximum number of characters we send from the content
const MAXIMUM_NUMBER_OF_CHARACTERS_SENT_FROM_CONTENT = 240;

// Creates the prompt that will eventually be sent to OpenAI. It uses the current post title, content (before the actual AI block) - or a slice of it if too long, and tags + categories names
const createPrompt = ( postTitle, contentBeforeCurrentBlock, tagsAndCategoriesNames ) => {
	const content = contentBeforeCurrentBlock
		.filter( function ( block ) {
			return block && block.attributes && block.attributes.content;
		} )
		.map( function ( block ) {
			return block.attributes.content.replaceAll( '<br/>', '\n' );
		} )
		.join( '\n' );
	const shorter_content = content.slice( -1 * MAXIMUM_NUMBER_OF_CHARACTERS_SENT_FROM_CONTENT );

	// If title is not added, we will only complete.
	if ( ! postTitle ) {
		return shorter_content;
	}

	// Title, content and categories
	if ( shorter_content && tagsAndCategoriesNames.length ) {
		return sprintf(
			/** translators: This will be a prompt to OpenAI to generate a post based on the post title, comma-seperated category names and the last MAXIMUM_NUMBER_OF_CHARACTERS_SENT_FROM_CONTENT characters of content. */
			__( "This is a post titled '%1$s', published in categories '%2$s':\n\n … %3$s", 'jetpack' ), // eslint-disable-line @wordpress/i18n-no-collapsible-whitespace
			postTitle,
			tagsAndCategoriesNames,
			shorter_content
		);
	}

	// No content, only title and categories
	if ( tagsAndCategoriesNames.length ) {
		return sprintf(
			/** translators: This will be a prompt to OpenAI to generate a post based on the post title, and comma-seperated category names. */
			__( "This is a post titled '%1$s', published in categories '%2$s':\n", 'jetpack' ), // eslint-disable-line @wordpress/i18n-no-collapsible-whitespace
			postTitle,
			tagsAndCategoriesNames
		);
	}

	// Title and content
	if ( shorter_content ) {
		return sprintf(
			/** translators: This will be a prompt to OpenAI to generate a post based on the post title, and the last MAXIMUM_NUMBER_OF_CHARACTERS_SENT_FROM_CONTENT characters of content. */
			__( "This is a post titled '%1$s':\n\n…%2$s", 'jetpack' ), // eslint-disable-line @wordpress/i18n-no-collapsible-whitespace
			postTitle,
			shorter_content
		);
	}

	return sprintf(
		/** translators: This will be a prompt to OpenAI to generate a post based on the post title */
		__( 'Write content of a post titled "%s"', 'jetpack' ),
		postTitle
	);
};

function ShowContent( { html, showAnimation, onAnimationDone, onContentChange } ) {
	const DELAY = 50;
	const [ content, setContent ] = useState( '' );

	useEffect(
		() => {
			// That will only happen once and will displays the content word by word if showAnimation is truthy
			if ( showAnimation ) {
				// This is to animate text input. I think this will give an idea of a "better" AI.
				// At this point this is an established pattern.
				const tokens = html.split( ' ' );
				for ( let i = 1; i < tokens.length; i++ ) {
					const output = tokens.slice( 0, i ).join( ' ' );
					setTimeout( () => setContent( output ), DELAY * i );
				}
				setTimeout( () => {
					setContent( html );
					onAnimationDone();
				}, DELAY * tokens.length );
			} else {
				setContent( html );
			}
		},
		// eslint-disable-next-line
		[]
	);

	return (
		<div className="content">
			<RichText tagName="p" value={ content } identifier="content" onChange={ onContentChange } />
		</div>
	);
}

export default function Edit( { attributes, setAttributes, clientId } ) {
	const [ isLoadingCompletion, setIsLoadingCompletion ] = useState( false );
	const [ isLoadingCategories, setIsLoadingCategories ] = useState( false );
	const [ isWaitingForPreviousBlock, setIsWaitingForPreviousBlock ] = useState( false );
	const [ needsMoreCharacters, setNeedsMoreCharacters ] = useState( 0 );
	const [ showRetry, setShowRetry ] = useState( false );
	const [ errorMessage, setErrorMessage ] = useState( false );
	const { tracks } = useAnalytics();

	// Let's grab post data so that we can do something smart.
	const currentPostTitle = useSelect( select =>
		select( 'core/editor' ).getEditedPostAttribute( 'title' )
	);

	const postId = useSelect( select => select( 'core/editor' ).getCurrentPostId() );

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

	const taxonomies = categoryObjects.filter( cat => cat.id !== 1 ).concat( tagObjects );
	const categoryNames = taxonomies.map( ( { name } ) => name ).join( ', ' );
	const contentBefore = useSelect( select => {
		const editor = select( 'core/block-editor' );
		const index = editor.getBlockIndex( clientId );
		return editor.getBlocks().slice( 0, index ) ?? [];
	} );

	const containsAiUntriggeredParagraph = () => {
		const blockName = 'jetpack/' + aiParagraphBlockName;
		return (
			contentBefore.filter(
				block => block.name && block.name === blockName && ! block.attributes.content
			).length > 0
		);
	};

	const getSuggestionFromOpenAI = () => {
		if ( !! attributes.content || isLoadingCompletion ) {
			return;
		}

		setShowRetry( false );
		setIsWaitingForPreviousBlock( false );
		setErrorMessage( false );
		setNeedsMoreCharacters( 0 );
		setIsLoadingCompletion( true );

		const data = {
			content: createPrompt( currentPostTitle, contentBefore, categoryNames ),
			post_id: postId,
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
				const result = res.prompts[ 0 ].text.trim().replaceAll( '\n', '<br/>' );
				setAttributes( { content: result } );
				setIsLoadingCompletion( false );
			} )
			.catch( () => {
				setErrorMessage(
					__(
						'Whoops, we have encountered an error. AI is like really, really hard and this is an experimental feature. Please try again later.',
						'jetpack'
					)
				);
				setShowRetry( true );
				setIsLoadingCompletion( false );
			} );
	};

	// Waiting state means there is nothing to be done until it resolves
	const isWaitingState = isLoadingCompletion || isLoadingCategories;
	// Content is loaded
	const contentIsLoaded = !! attributes.content;

	// We do nothing is we are waiting for stuff OR if the content is already loaded.
	const noLogicNeeded = contentIsLoaded || isWaitingState;

	if ( ! noLogicNeeded ) {
		const prompt = createPrompt( currentPostTitle, contentBefore, categoryNames );
		const nbCharactersNeeded = NUMBER_OF_CHARACTERS_NEEDED - prompt.length;

		if ( containsAiUntriggeredParagraph() ) {
			if ( ! isWaitingForPreviousBlock ) {
				setErrorMessage(
					/** translators: This will be an error message when multiple Open AI paragraph blocks are triggered on the same page. */
					__( 'Waiting for the previous AI paragraph block to finish', 'jetpack' )
				);
				setIsWaitingForPreviousBlock( true );
			}
		} else if (
			prompt.length < NUMBER_OF_CHARACTERS_NEEDED &&
			needsMoreCharacters !== nbCharactersNeeded
		) {
			setErrorMessage(
				sprintf(
					/** translators: First placeholder is a number of more characters we need */
					__(
						'Please write a longer title or a few more words in the opening preceding the AI block. Our AI model needs %1$d more characters.',
						'jetpack'
					),
					nbCharactersNeeded
				)
			);
			setIsWaitingForPreviousBlock( false );
			setNeedsMoreCharacters( nbCharactersNeeded );
		} else if ( needsMoreCharacters !== 0 && prompt.length >= NUMBER_OF_CHARACTERS_NEEDED ) {
			setErrorMessage(
				/** translators: This is to retry to complete the text */
				__( 'Ready to retry', 'jetpack' )
			);
			setShowRetry( true );
			setIsWaitingForPreviousBlock( false );
			setNeedsMoreCharacters( 0 );
		} else if ( needsMoreCharacters === 0 && ! showRetry ) {
			getSuggestionFromOpenAI();
		}
	}

	return (
		<div { ...useBlockProps() }>
			{ ! isLoadingCompletion && ! isLoadingCategories && errorMessage && (
				<Placeholder label={ __( 'AI Paragraph', 'jetpack' ) } instructions={ errorMessage }>
					{ showRetry && (
						<Button variant="primary" onClick={ () => getSuggestionFromOpenAI() }>
							{ __( 'Retry', 'jetpack' ) }
						</Button>
					) }
				</Placeholder>
			) }

			{ contentIsLoaded && (
				<ShowContent
					html={ attributes.content }
					showAnimation={ ! attributes.animationDone }
					onContentChange={ value => setAttributes( { content: value } ) }
					onAnimationDone={ () => setAttributes( { animationDone: true } ) }
				/>
			) }

			{ ! attributes.content && isWaitingState && (
				<div style={ { padding: '10px', textAlign: 'center' } }>
					<Spinner
						style={ {
							height: 'calc(4px * 20)',
							width: 'calc(4px * 20)',
						} }
					/>
				</div>
			) }
		</div>
	);
}
