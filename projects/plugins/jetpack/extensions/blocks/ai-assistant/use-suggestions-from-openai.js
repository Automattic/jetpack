/**
 * External dependencies
 */
import apiFetch from '@wordpress/api-fetch';
import { useSelect, select as selectData } from '@wordpress/data';
import { useEffect, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
/**
 * Internal dependencies
 */
import { buildPromptTemplate } from './create-prompt';
import { askJetpack } from './get-suggestion-with-stream';
import { DEFAULT_PROMPT_LANGUAGE } from './i18n-dropdown-control';
import { DEFAULT_PROMPT_TONE } from './tone-dropdown-control';

/**
 * Returns partial content from the beginning of the post
 * to the current block (clientId)
 *
 * @param {string} clientId - The current block clientId.
 * @returns {string}          The partial content.
 */
export function getPartialContentToBlock( clientId ) {
	if ( ! clientId ) {
		return '';
	}

	const editor = selectData( 'core/block-editor' );
	const index = editor.getBlockIndex( clientId );
	const blocks = editor.getBlocks().slice( 0, index ) ?? [];
	if ( ! blocks?.length ) {
		return '';
	}

	return blocks
		.filter( function ( block ) {
			return block && block.attributes && block.attributes.content;
		} )
		.map( function ( block ) {
			return block.attributes.content.replaceAll( '<br/>', '\n' );
		} )
		.join( '\n' );
}

/**
 * Returns content from all blocks,
 * by inspecting the blocks `content` attributes
 *
 * @returns {string} The content.
 */
export function getContentFromBlocks() {
	const editor = selectData( 'core/block-editor' );
	const blocks = editor.getBlocks();

	if ( ! blocks?.length ) {
		return '';
	}

	return blocks
		.filter( function ( block ) {
			return block && block.attributes && block.attributes.content;
		} )
		.map( function ( block ) {
			return block.attributes.content.replaceAll( '<br/>', '\n' );
		} )
		.join( '\n' );
}

const useSuggestionsFromOpenAI = ( {
	clientId,
	content,
	setAttributes,
	setErrorMessage,
	tracks,
	userPrompt,
} ) => {
	const [ isLoadingCategories, setIsLoadingCategories ] = useState( false );
	const [ isLoadingCompletion, setIsLoadingCompletion ] = useState( false );
	const [ showRetry, setShowRetry ] = useState( false );
	const [ lastPrompt, setLastPrompt ] = useState( '' );

	// Let's grab post data so that we can do something smart.

	const currentPostTitle = useSelect( select =>
		select( 'core/editor' ).getEditedPostAttribute( 'title' )
	);

	//TODO: decide if we still want to load categories and tags now user is providing the prompt by default.
	// If not the following can be removed.
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
	// eslint-disable-next-line no-unused-vars
	const categoryNames = categoryObjects
		.filter( cat => cat.id !== 1 )
		.map( ( { name } ) => name )
		.join( ', ' );
	// eslint-disable-next-line no-unused-vars
	const tagNames = tagObjects.map( ( { name } ) => name ).join( ', ' );

	const getSuggestionFromOpenAI = ( type, options = {} ) => {
		options = {
			retryRequest: false,
			tone: DEFAULT_PROMPT_TONE,
			language: DEFAULT_PROMPT_LANGUAGE,
			...options,
		};

		if ( isLoadingCompletion ) {
			return;
		}

		setShowRetry( false );
		setErrorMessage( false );
		setIsLoadingCompletion( true );

		let prompt = lastPrompt;

		if ( ! options.retryRequest ) {
			// If there is a content already, let's iterate over it.
			switch ( type ) {
				/*
				 * Generate content from title.
				 */
				case 'titleSummary':
					prompt = buildPromptTemplate( {
						request:
							'Please help me write a short piece for a blog post based on the content below',
						content: currentPostTitle,
					} );
					break;

				/*
				 * Continue generating from the content below.
				 */
				case 'continue':
					prompt = buildPromptTemplate( {
						request: 'Please continue writing from the content below.',
						rules: [ 'Only output the continuation of the content, without repeating it' ],
						content: getPartialContentToBlock( clientId ),
					} );
					break;

				/*
				 * Change the tone of the content.
				 */
				case 'changeTone':
					prompt = buildPromptTemplate( {
						request: `Please, rewrite with a ${ options.tone } tone.`,
						content,
					} );
					break;

				/*
				 * Summarize the content.
				 */
				case 'summarize':
					prompt = buildPromptTemplate( {
						request: 'Summarize the content below.',
						content: content?.length ? content : getContentFromBlocks(),
					} );
					break;

				/*
				 * Make the content longer.
				 */
				case 'makeLonger':
					prompt = buildPromptTemplate( {
						request: 'Make the content below longer.',
						content,
					} );
					break;

				/*
				 * Make the content shorter.
				 */
				case 'makeShorter':
					prompt = buildPromptTemplate( {
						request: 'Make the content below shorter.',
						content,
					} );
					break;

				/*
				 * Generate a title for this blog post, based on the content.
				 */
				case 'generateTitle':
					prompt = buildPromptTemplate( {
						request: 'Generate a title for this blog post',
						rules: [ 'Only output the raw title, without any prefix or quotes' ],
						content: content?.length ? content : getContentFromBlocks(),
					} );
					break;

				/*
				 * Simplify the content.
				 */
				case 'simplify':
					prompt = buildPromptTemplate( {
						request: 'Simplify the content below.',
						rules: [
							'Use words and phrases that are easier to understand for non-technical people',
							'Output in the same language of the content',
							'Use as much of the original language as possible',
						],
						content: content?.length ? content : getContentFromBlocks(),
					} );
					break;

				/**
				 * Correct grammar and spelling
				 */
				case 'correctSpelling':
					prompt = buildPromptTemplate( {
						request: 'Correct any spelling and grammar mistakes from the content below.',
						content: content?.length ? content : getContentFromBlocks(),
					} );
					break;

				/**
				 * Change the language, based on options.language
				 */
				case 'changeLanguage':
					prompt = buildPromptTemplate( {
						request: `Please, rewrite in the following language: ${ options.language }`,
						content: content?.length ? content : getContentFromBlocks(),
					} );
					break;

				default:
					prompt = buildPromptTemplate( {
						request: userPrompt,
						content,
					} );
					break;
			}
		}

		const data = { content: prompt };
		tracks.recordEvent( 'jetpack_ai_gpt3_completion', {
			post_id: postId,
		} );

		if ( ! options.retryRequest ) {
			setLastPrompt( prompt );
			setAttributes( { promptType: type } );
		}

		apiFetch( {
			path: '/wpcom/v2/jetpack-ai/completions',
			method: 'POST',
			data: data,
		} )
			.then( res => {
				const result = res.trim();

				/*
				 * Hack to udpate the content.
				 * @todo: maybe we should not pass the setAttributes function
				 */
				setAttributes( { content: '' } );

				setTimeout( () => {
					setAttributes( {
						content: result.length ? result : '',
					} );
				}, 10 );

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
	return {
		isLoadingCategories,
		isLoadingCompletion,
		setIsLoadingCategories,
		setShowRetry,
		showRetry,
		postTitle: currentPostTitle,
		contentBefore: getPartialContentToBlock( clientId ),
		wholeContent: getContentFromBlocks( clientId ),

		getSuggestionFromOpenAI,
		retryRequest: () => getSuggestionFromOpenAI( '', { retryRequest: true } ),
	};
};

export default useSuggestionsFromOpenAI;

window.askJetpack = askJetpack;
