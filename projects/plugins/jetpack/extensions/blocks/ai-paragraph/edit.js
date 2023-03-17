import './editor.scss';

import { useAnalytics } from '@automattic/jetpack-shared-extension-utils';
import apiFetch from '@wordpress/api-fetch';
import { useBlockProps, InnerBlocks } from '@wordpress/block-editor';
import { pasteHandler } from '@wordpress/blocks';
import { Placeholder, Button, Spinner } from '@wordpress/components';
import { useSelect, useDispatch } from '@wordpress/data';
import { useState, useEffect, useCallback } from '@wordpress/element';
import { sprintf, __ } from '@wordpress/i18n';
import { deriveStates, STATE as AI_BLOCK_STATE, UNTRIGGERED_STATES } from './state';
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

export default function Edit( { attributes: { state }, setAttributes, clientId } ) {
	const [ content, setContent ] = useState( '' );
	const [ isLoadingCategories, setIsLoadingCategories ] = useState( false );
	const [ needsMoreCharacters, setNeedsMoreCharacters ] = useState( false );
	const [ errorMessage, setErrorMessage ] = useState( false );
	const { tracks } = useAnalytics();

	/**
	 * Set the state of the block.
	 *
	 * Setting the state to ERROR or RETRY will set the error message, but RETRY
	 * also adds the RETRY button to the error message.
	 *
	 * DEFAULT is the initial state.
	 * PROCESSING is for when the block is waiting for the AI to respond.
	 * RENDERING is after the AI has responded and the block is animating the response.
	 * DONE after content is rendered.
	 *
	 * @param {string} _state - The state to set.
	 * @param {string|false} _errorMessage - The error message to set.
	 */
	const setState = useCallback(
		( _state = AI_BLOCK_STATE.RETRY, _errorMessage = false ) => {
			setAttributes( { state: _state } );
			setErrorMessage( _errorMessage );
		},
		[ setAttributes ]
	);
	/**
	 * isError: true if the block is in an error state.
	 * isTriggered: if OpenAI request has been made.
	 * isDoneLoading: if loading & rendering is done.
	 * isWaitingForAI: if OpenAI request is in progress.
	 * isReadyToRetry: if the block is in an error state and can be retried.
	 */
	const { isError, isTriggered, isDoneLoading, isWaitingForAI, isReadyToRetry } = deriveStates(
		state
	);

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

	const containsAiUntriggeredParagraph = useCallback( () => {
		const blockName = 'jetpack/' + aiParagraphBlockName;
		return (
			contentBefore.filter(
				block =>
					block.name &&
					block.name === blockName &&
					UNTRIGGERED_STATES.includes( block.attributes.state )
			).length > 0
		);
	}, [ contentBefore ] );

	// Waiting state means there is nothing to be done until it resolves
	const isWaitingState = isWaitingForAI || isLoadingCategories;

	// Content is loading/loaded (i.e. processing, rendering, done).
	const contentIsLoaded = isTriggered;

	// We do nothing if we are waiting for stuff OR if the content is already loaded.
	const noLogicNeeded = contentIsLoaded || isWaitingState;

	const getSuggestionFromOpenAI = useCallback( () => {
		if ( noLogicNeeded ) {
			return;
		}

		// Reset all the error handling.
		setState( AI_BLOCK_STATE.PROCESSING );
		setNeedsMoreCharacters( false );

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
				const result = res.trim();
				setContent( result );
				setState( AI_BLOCK_STATE.RENDERING );
			} )
			.catch( e => {
				if ( e.message ) {
					setState( AI_BLOCK_STATE.RETRY, e.message ); // Message was already translated by the backend
				} else {
					setState(
						AI_BLOCK_STATE.RETRY,
						__(
							'Whoops, we have encountered an error. AI is like really, really hard and this is an experimental feature. Please try again later.',
							'jetpack'
						)
					);
				}
			} );
	}, [
		categoryNames,
		contentBefore,
		currentPostTitle,
		noLogicNeeded,
		postId,
		setState,
		tagNames,
		tracks,
	] );

	// This effect is like the main event loop for the block.
	//
	// As state changes, this block evaluates what needs to change. A default
	// state falls through to the bottom and triggers the OpenAI request.
	useEffect( () => {
		if ( noLogicNeeded ) {
			return;
		}
		const prompt = createPrompt( currentPostTitle, contentBefore, categoryNames, tagNames );

		if ( containsAiUntriggeredParagraph() ) {
			setState(
				AI_BLOCK_STATE.ERROR,
				/** translators: This will be an error message when multiple Open AI paragraph blocks are triggered on the same page. */
				__( 'Waiting for the previous AI paragraph block to finish', 'jetpack' )
			);
		} else if ( ! prompt ) {
			setState(
				AI_BLOCK_STATE.ERROR,
				/** translators: First placeholder is a number of more characters we need */
				__(
					'Please write a longer title or a few more words in the opening preceding the AI block. Our AI model needs some content.',
					'jetpack'
				)
			);
			setNeedsMoreCharacters( true );
		} else if ( needsMoreCharacters ) {
			/** translators: This is to retry to complete the text */
			setState( AI_BLOCK_STATE.RETRY, __( 'Ready to retry', 'jetpack' ) );
			setNeedsMoreCharacters( false );
		} else if ( state === AI_BLOCK_STATE.DEFAULT ) {
			getSuggestionFromOpenAI();
		}
	}, [
		categoryNames,
		containsAiUntriggeredParagraph,
		contentBefore,
		currentPostTitle,
		getSuggestionFromOpenAI,
		isReadyToRetry,
		needsMoreCharacters,
		noLogicNeeded,
		setState,
		state,
		tagNames,
	] );

	const { replaceInnerBlocks } = useDispatch( 'core/block-editor' );

	const updateInnerBlocks = source => {
		// Get a list of inner blocks
		const newInnerBlocks = pasteHandler( {
			HTML: '',
			mode: 'BLOCKS',
			plainText: source,
		} );
		replaceInnerBlocks( clientId, newInnerBlocks );
	};

	// This is to animate text input. This will give an idea of a "better" AI.
	// At this point this is an established pattern.
	useEffect( () => {
		// If the content is not loaded, we do nothing.
		if ( ! content || state !== AI_BLOCK_STATE.RENDERING ) {
			return;
		}

		// Break the content into words
		const tokens = content.split( ' ' );

		// For each word, update the inner block content.
		for ( let i = 1; i < tokens.length; i++ ) {
			const output = tokens.slice( 0, i ).join( ' ' );
			setTimeout( () => updateInnerBlocks( output ), 50 * i );
		}
		// Finally set the inner block to the full content.
		setTimeout( () => {
			updateInnerBlocks( content );
			setAttributes( { state: AI_BLOCK_STATE.DONE } );
		}, 50 * tokens.length );
	}, [ state, content ] ); // eslint-disable-line react-hooks/exhaustive-deps

	const blockProps = useBlockProps();

	return (
		<div { ...blockProps }>
			{ isDoneLoading && ! isError && <InnerBlocks /> }

			{ isError && (
				<Placeholder
					label={ __( 'AI Paragraph', 'jetpack' ) }
					instructions={ errorMessage || __( 'Oops! Bad bots!', 'jetpack' ) }
				>
					{ ( ! errorMessage || isReadyToRetry ) && (
						<Button variant="primary" onClick={ () => getSuggestionFromOpenAI() }>
							{ __( 'Retry', 'jetpack' ) }
						</Button>
					) }
				</Placeholder>
			) }

			{ isWaitingForAI && ! isError && (
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
