import './editor.scss';

import { useAnalytics } from '@automattic/jetpack-shared-extension-utils';
import apiFetch from '@wordpress/api-fetch';
import { useBlockProps, InnerBlocks } from '@wordpress/block-editor';
import { pasteHandler } from '@wordpress/blocks';
import { Placeholder, Button, Spinner } from '@wordpress/components';
import { useSelect, useDispatch } from '@wordpress/data';
import { useState, useEffect, useCallback } from '@wordpress/element';
import { sprintf, __ } from '@wordpress/i18n';
import classNames from 'classnames';
import { STATE as AI_BLOCK_STATE } from './attributes';
import { name as aiParagraphBlockName } from './index';

// Maximum number of characters we send from the content
export const MAXIMUM_NUMBER_OF_CHARACTERS_SENT_FROM_CONTENT = 1024;

const is_untriggered = state => state === AI_BLOCK_STATE.DEFAULT;
const is_triggered = state => state !== AI_BLOCK_STATE.DEFAULT;
const is_processing = state => state === AI_BLOCK_STATE.PROCESSING;
const is_done = state => state === AI_BLOCK_STATE.DONE;

/**
 * Creates the prompt that will eventually be sent to OpenAI.
 *
 * It uses the current post title, content (before the actual AI block) - or a slice of it if too
 * long, and tags + categories names
 *
 * @param {string} postTitle
 * @param {string} contentBeforeCurrentBlock
 * @param {Array<string>} categoriesNames
 * @param {Array<string>} tagsNames
 * @returns {string}|false - The prompt
 */
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

/**
 * Returns taxonomy objects (categories or tags).
 *
 * @param {string} postAttribute
 * @param {string} taxonomy
 * @returns {[Array, boolean]} - Array of taxonomy objects and a boolean indicating if we are still loading
 */
function useTaxonomy( postAttribute, taxonomy ) {
	let loading = false;
	const taxonomies =
		useSelect( select => select( 'core/editor' ).getEditedPostAttribute( postAttribute ) ) || [];
	const taxonomyObjects = useSelect(
		select => {
			return taxonomies
				.map( taxonomyId => {
					const _taxonomy = select( 'core' ).getEntityRecord( 'taxonomy', taxonomy, taxonomyId );

					if ( ! _taxonomy ) {
						loading = true;
						return;
					}

					return _taxonomy;
				} )
				.filter( Boolean ); // Remove undefined values
		},
		[ taxonomies ]
	);
	return [ taxonomyObjects, loading ];
}

export default function Edit( { attributes: { state }, setAttributes, clientId } ) {
	const [ content, setContent ] = useState( '' );
	const [ needsMoreCharacters, setNeedsMoreCharacters ] = useState( false );
	const [ showRetry, setShowRetry ] = useState( false );
	const [ errorMessage, setErrorMessage ] = useState( false );
	const { tracks } = useAnalytics();

	// Let's grab post data so that we can do something smart.
	const currentPostTitle = useSelect( select =>
		select( 'core/editor' ).getEditedPostAttribute( 'title' )
	);

	const postId = useSelect( select => select( 'core/editor' ).getCurrentPostId() );

	const [ categoryObjects, categoriesLoading ] = useTaxonomy( 'categories', 'category' );
	const categoryNames = categoryObjects
		.filter( cat => cat.id !== 1 )
		.map( ( { name } ) => name )
		.join( ', ' );

	const [ tagObjects, tagsLoading ] = useTaxonomy( 'tags', 'post_tag' );
	const tagNames = tagObjects.map( ( { name } ) => name ).join( ', ' );

	const isTaxonomyStillLoading = categoriesLoading || tagsLoading;

	const contentBefore = useSelect( select => {
		const editor = select( 'core/block-editor' );
		const index = editor.getBlockIndex( clientId );
		return editor.getBlocks().slice( 0, index ) ?? [];
	} );

	const containsAiUntriggeredParagraph = useCallback( () => {
		const blockName = 'jetpack/' + aiParagraphBlockName;
		return (
			contentBefore.filter(
				block => block.name && block.name === blockName && is_untriggered( block.attributes.state )
			).length > 0
		);
	}, [ contentBefore ] );

	const getSuggestionFromOpenAI = useCallback( () => {
		// Don't trigger a new prompt:
		// - if the content exists
		// - if the taxonomy is still loading
		// - or we're currently loading one.
		if ( !! content || isTaxonomyStillLoading || is_triggered( state ) ) {
			return;
		}

		setShowRetry( false );
		setErrorMessage( false );
		setNeedsMoreCharacters( false );
		setAttributes( { state: AI_BLOCK_STATE.PROCESSING } );

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
				setAttributes( { state: AI_BLOCK_STATE.RENDERING } );
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
				setAttributes( { state: AI_BLOCK_STATE.DEFAULT } );
			} );
	}, [
		categoryNames,
		content,
		contentBefore,
		currentPostTitle,
		isTaxonomyStillLoading,
		postId,
		setAttributes,
		state,
		tagNames,
		tracks,
	] );

	// Waiting state means there is nothing to be done until it resolves
	const isWaitingState = isTaxonomyStillLoading || is_processing( state );

	// Content is loaded
	const contentIsLoaded = is_done( state );

	// We do nothing if we are waiting for stuff OR if the content is already loaded.
	const noLogicNeeded = contentIsLoaded || isWaitingState;

	useEffect( () => {
		if ( noLogicNeeded ) {
			return;
		}

		if ( containsAiUntriggeredParagraph() ) {
			setErrorMessage(
				/** translators: This will be an error message when multiple Open AI paragraph blocks are triggered on the same page. */
				__( 'Waiting for the previous AI paragraph block to finish', 'jetpack' )
			);
			return;
		}

		const prompt = createPrompt( currentPostTitle, contentBefore, categoryNames, tagNames );

		if ( ! prompt ) {
			setErrorMessage(
				/** translators: First placeholder is a number of more characters we need */
				__(
					'Please write a longer title or a few more words in the opening preceding the AI block. Our AI model needs some content.',
					'jetpack'
				)
			);
			setNeedsMoreCharacters( true );
			return;
		} else if ( needsMoreCharacters ) {
			setErrorMessage(
				/** translators: This is to retry to complete the text */
				__( 'Ready to retry', 'jetpack' )
			);
			setShowRetry( true );
			setNeedsMoreCharacters( false );
		} else if ( ! showRetry ) {
			getSuggestionFromOpenAI();
		}
	}, [
		categoryNames,
		containsAiUntriggeredParagraph,
		contentBefore,
		currentPostTitle,
		getSuggestionFromOpenAI,
		needsMoreCharacters,
		noLogicNeeded,
		showRetry,
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

	// Used for styling the block in the editor.
	const classes = classNames( `state-${ state }` );
	const blockProps = useBlockProps( {
		className: classes,
	} );

	return (
		<div { ...blockProps }>
			<InnerBlocks />

			{ ! is_done( state ) && ! isTaxonomyStillLoading && errorMessage && (
				<Placeholder label={ __( 'AI Paragraph', 'jetpack' ) } instructions={ errorMessage }>
					{ showRetry && (
						<Button variant="primary" onClick={ () => getSuggestionFromOpenAI() }>
							{ __( 'Retry', 'jetpack' ) }
						</Button>
					) }
				</Placeholder>
			) }

			{ ! is_done( state ) && isWaitingState && (
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
