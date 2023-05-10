import apiFetch from '@wordpress/api-fetch';
import { useSelect, select as selectData } from '@wordpress/data';
import { useEffect, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import debugFactory from 'debug';
import MarkdownIt from 'markdown-it';
import { createPrompt } from './create-prompt';

const debug = debugFactory( 'jetpack:ai-assistant' );
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
	const categoryNames = categoryObjects
		.filter( cat => cat.id !== 1 )
		.map( ( { name } ) => name )
		.join( ', ' );
	const tagNames = tagObjects.map( ( { name } ) => name ).join( ', ' );

	const getSuggestionFromOpenAI = ( type, retryRequest = false ) => {
		if ( !! content || isLoadingCompletion ) {
			return;
		}

		setShowRetry( false );
		setErrorMessage( false );
		setIsLoadingCompletion( true );

		const prompt = retryRequest
			? lastPrompt
			: createPrompt(
					currentPostTitle,
					getPartialContentToBlock( clientId ),
					getContentFromBlocks(),
					userPrompt,
					type,
					categoryNames,
					tagNames
			  );

		const data = { content: prompt };
		tracks.recordEvent( 'jetpack_ai_gpt3_completion', {
			post_id: postId,
		} );

		if ( ! retryRequest ) {
			setLastPrompt( prompt );
		}

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
		retryRequest: () => getSuggestionFromOpenAI( '', true ),
	};
};

export default useSuggestionsFromOpenAI;

export function askJetpack( question ) {
	const apiNonce = window.JP_CONNECTION_INITIAL_STATE.apiNonce;

	async function requestToken() {
		const request = await fetch(
			'/wp-json/jetpack/hack/get-openai-jwt?_cacheBuster=' + Date.now(),
			{
				credentials: 'same-origin',
				headers: {
					'X-WP-Nonce': apiNonce,
				},
			}
		);

		if ( ! request.ok ) {
			throw new Error( 'JWT request failed' );
		}

		const data = await request.json();
		return {
			token: data.token,
			blogId: data.blog_id,
		};
	}

	/**
	 * Leaving this here to make it easier to debug the streaming API calls for now
	 */
	async function askQuestion() {
		const { blogId, token } = await requestToken();

		const url = new URL(
			'https://public-api.wordpress.com/wpcom/v2/sites/' + blogId + '/jetpack-openai-query'
		);
		url.searchParams.append( 'question', question );
		url.searchParams.append( 'token', token );

		const source = new EventSource( url.toString() );
		let fullMessage = '';

		source.addEventListener( 'error', err => {
			debug( 'Error', err );
		} );

		source.addEventListener( 'message', e => {
			if ( e.data === '[DONE]' ) {
				source.close();
				debug( 'Done. Full message: ' + fullMessage );
				return;
			}

			const data = JSON.parse( e.data );
			const chunk = data.choices[ 0 ].delta.content;
			if ( chunk ) {
				fullMessage += chunk;
				debug( chunk );
			}
		} );
	}

	askQuestion().catch( err => debug( 'Error', err ) );
}

window.askJetpack = askJetpack;
