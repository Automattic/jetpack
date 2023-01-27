import './editor.scss';

import { useAnalytics } from '@automattic/jetpack-shared-extension-utils';
import apiFetch from '@wordpress/api-fetch';
import { useBlockProps, InnerBlocks } from '@wordpress/block-editor';
import { Placeholder, Button, Spinner } from '@wordpress/components';
import { useSelect, useDispatch } from '@wordpress/data';
import { useState, useEffect, useCallback } from '@wordpress/element';
import { sprintf, __ } from '@wordpress/i18n';
import classNames from 'classnames';
import { name as aiParagraphBlockName } from './index';

// Maximum number of characters we send from the content
export const MAXIMUM_NUMBER_OF_CHARACTERS_SENT_FROM_CONTENT = 1024;

// Creates the prompt that will eventually be sent to OpenAI. It uses the current post title, content (before the actual AI block) - or a slice of it if too long, and tags + categories names
export const createPrompt = (
	postTitle = '',
	contentBeforeCurrentBlock = [],
	categoriesNames = '',
	tagsNames = ''
) => {
	const content = contentBeforeCurrentBlock
		.filter( function ( block ) {
			return block && block.attributes && block.attributes.content;
		} )
		.map( function ( block ) {
			return block.attributes.content.replaceAll( '<br/>', '\n' );
		} )
		.join( '\n' );
	const shorter_content = content.slice( -1 * MAXIMUM_NUMBER_OF_CHARACTERS_SENT_FROM_CONTENT );

	// We prevent a prompt if everything is empty
	if ( ! postTitle && ! shorter_content && ! categoriesNames && ! tagsNames ) {
		return false;
	}

	let prompt = '';
	// We will generate the content
	if ( postTitle ) {
		prompt = sprintf(
			/** translators: This will be the beginning of a prompt that will be sent to OpenAI based on the post title. */
			__( "Please help me write a short piece of a blog post titled '%1$s'", 'jetpack' ),
			postTitle
		);
	} else {
		prompt = __( 'Please help me write a short piece of a blog post', 'jetpack' );
	}

	if ( categoriesNames ) {
		/** translators: This will be the follow up of a prompt that will be sent to OpenAI based on comma-seperated category names. */
		prompt += sprintf( __( ", published in categories '%1$s'", 'jetpack' ), categoriesNames );
	}

	if ( tagsNames ) {
		/** translators: This will be the follow up of a prompt that will be sent to OpenAI based on comma-seperated category names. */
		prompt += sprintf( __( " and tagged '%1$s'", 'jetpack' ), tagsNames );
	}

	prompt += __( '. Please only output generated content ready for publishing.', 'jetpack' );

	if ( shorter_content ) {
		/** translators: This will be the end of a prompt that will be sent to OpenAI with the last MAXIMUM_NUMBER_OF_CHARACTERS_SENT_FROM_CONTENT characters of content.*/
		prompt += sprintf( __( ' Please continue from here:\n\n … %s', 'jetpack' ), shorter_content ); // eslint-disable-line @wordpress/i18n-no-collapsible-whitespace
	}

	return prompt.trim();
};

export default function Edit( { attributes, setAttributes, clientId } ) {
	const [ content, setContent ] = useState( '' );
	const [ isLoadingCompletion, setIsLoadingCompletion ] = useState( false );
	const [ isLoadingCategories, setIsLoadingCategories ] = useState( false );
	const [ needsMoreCharacters, setNeedsMoreCharacters ] = useState( false );
	const [ showRetry, setShowRetry ] = useState( false );
	const [ errorMessage, setErrorMessage ] = useState( false );
	const { tracks } = useAnalytics();
	const { triggered } = attributes;

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

	const containsAiUntriggeredParagraph = () => {
		const blockName = 'jetpack/' + aiParagraphBlockName;
		return (
			contentBefore.filter(
				block => block.name && block.name === blockName && ! block.attributes.triggered
			).length > 0
		);
	};

	const getSuggestionFromOpenAI = () => {
		console.log( 'triggered', triggered );
		if ( !! content || isLoadingCompletion || triggered) {
			return;
		}

		setShowRetry( false );
		setErrorMessage( false );
		setNeedsMoreCharacters( false );
		setIsLoadingCompletion( true );

		const data = {
			content: createPrompt( currentPostTitle, contentBefore, categoryNames, tagNames ),
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
				const result = res.prompts[ 0 ].text.trim();
				setContent( result );
				setAttributes( { triggered: true } );
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

	// Waiting state means there is nothing to be done until it resolves
	const isWaitingState = isLoadingCompletion || isLoadingCategories;
	// Content is loaded
	const contentIsLoaded = triggered || !! content;

	// We do nothing if we are waiting for stuff OR if the content is already loaded.
	const noLogicNeeded = contentIsLoaded || isWaitingState;

	useSelect( () => {
		if ( ! noLogicNeeded ) {
			const prompt = createPrompt( currentPostTitle, contentBefore, categoryNames, tagNames );

			if ( containsAiUntriggeredParagraph() ) {
				setErrorMessage(
					/** translators: This will be an error message when multiple Open AI paragraph blocks are triggered on the same page. */
					__( 'Waiting for the previous AI paragraph block to finish', 'jetpack' )
				);
			} else if ( ! prompt ) {
				setErrorMessage(
					/** translators: First placeholder is a number of more characters we need */
					__(
						'Please write a longer title or a few more words in the opening preceding the AI block. Our AI model needs some content.',
						'jetpack'
					)
				);
				setNeedsMoreCharacters( true );
			} else if ( needsMoreCharacters ) {
				setErrorMessage(
					/** translators: This is to retry to complete the text */
					__( 'Ready to retry', 'jetpack' )
				);
				setShowRetry( true );
				setNeedsMoreCharacters( false );
			} else if ( ! needsMoreCharacters && ! showRetry ) {
				getSuggestionFromOpenAI();
			}
		}
	}, [
		currentPostTitle,
		contentBefore,
		categoryNames,
		tagNames,
		noLogicNeeded,
		needsMoreCharacters,
		showRetry,
	] );

	const innerBlocks = useSelect( select => {
		const aiParagraphBlock = select( 'core/block-editor' ).getBlocksByClientId( clientId );
		return aiParagraphBlock[ 0 ].innerBlocks;
	} );

	const { updateBlockAttributes } = useDispatch( 'core/block-editor' );

	const updateInnerBlocks = useCallback( content => {
		const paragraph = innerBlocks[ 0 ];
		if ( paragraph && content ) {
			updateBlockAttributes( paragraph.clientId, { source: content } );
		}
	}, [ innerBlocks ] );

	useEffect( () => {
		if ( ! content ) {
			return;
		}

		// This is to animate text input. I think this will give an idea of a "better" AI.
		// At this point this is an established pattern.
		const tokens = content.split( ' ' );
		for ( let i = 1; i < tokens.length; i++ ) {
			const output = tokens.slice( 0, i ).join( ' ' );
			setTimeout( () => updateInnerBlocks( output ), 50 * i );
		}
		setTimeout( () => {
			updateInnerBlocks( content );
		}, 50 * tokens.length );
	}, [ triggered ] );

	// Sets the inner blocks to a single paragraph block.

	console.log( 'clientId', clientId );
	const TEMPLATE = [ [ 'jetpack/markdown', {} ] ];

	const classes = classNames( {
		triggered,
	} );
	const blockProps = useBlockProps( {
		className: classes,
	} );

	return (
		<div { ...blockProps }>
			<InnerBlocks
				template={ TEMPLATE }
				templateLock="all"/>

			{ ! isLoadingCompletion && ! isLoadingCategories && errorMessage && (
				<Placeholder label={ __( 'AI Paragraph', 'jetpack' ) } instructions={ errorMessage }>
					{ showRetry && (
						<Button variant="primary" onClick={ () => getSuggestionFromOpenAI() }>
							{ __( 'Retry', 'jetpack' ) }
						</Button>
					) }
				</Placeholder>
			) }

			{ ! content && isWaitingState && (
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
