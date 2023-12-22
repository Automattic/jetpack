/**
 * External dependencies
 */
import { askQuestion } from '@automattic/jetpack-ai-client';
import { parse } from '@wordpress/blocks';
import { useSelect, useDispatch, dispatch } from '@wordpress/data';
import { useEffect, useState, useRef } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import debugFactory from 'debug';
/**
 * Internal dependencies
 */
import { DEFAULT_PROMPT_TONE } from '../../components/tone-dropdown-control';
import { buildPromptForBlock, delimiter } from '../../lib/prompt';
import {
	getContentFromBlocks,
	getPartialContentToBlock,
	getTextContentFromInnerBlocks,
} from '../../lib/utils/block-content';

const debug = debugFactory( 'jetpack-ai-assistant:event' );
const debugPrompt = debugFactory( 'jetpack-ai-assistant:prompt' );

const useSuggestionsFromOpenAI = ( {
	attributes,
	clientId,
	content,
	setError,
	tracks,
	userPrompt,
	onSuggestionDone,
	onUnclearPrompt,
	onModeration,
	requireUpgrade,
	requestingState,
} ) => {
	const [ isLoadingCategories, setIsLoadingCategories ] = useState( false );
	const [ isLoadingCompletion, setIsLoadingCompletion ] = useState( false );
	const [ wasCompletionJustRequested, setWasCompletionJustRequested ] = useState( false );
	const [ showRetry, setShowRetry ] = useState( false );
	const [ lastPrompt, setLastPrompt ] = useState( '' );
	const { updateBlockAttributes } = useDispatch( 'core/block-editor' );
	const { dequeueAiAssistantFeatureAyncRequest, setAiAssistantFeatureRequireUpgrade } =
		useDispatch( 'wordpress-com/plans' );
	const [ requestState, setRequestState ] = useState( requestingState || 'init' );
	const source = useRef();

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

		/*
		 * Returning a cleanup function that will stop
		 * the suggestion if it's still rolling.
		 */
		return () => {
			if ( source?.current ) {
				debug( 'Cleaning things up...' );
				source?.current?.close();
			}
		};
	}, [ loading, source ] );

	const postId = useSelect( select => select( 'core/editor' ).getCurrentPostId() );
	// eslint-disable-next-line no-unused-vars
	const categoryNames = categoryObjects
		.filter( cat => cat.id !== 1 )
		.map( ( { name } ) => name )
		.join( ', ' );
	// eslint-disable-next-line no-unused-vars
	const tagNames = tagObjects.map( ( { name } ) => name ).join( ', ' );

	const getStreamedSuggestionFromOpenAI = async ( type, options = {} ) => {
		/*
		 * Always dequeue/cancel the AI Assistant feature async request,
		 * in case there is one pending,
		 * when performing a new AI suggestion request.
		 */
		dequeueAiAssistantFeatureAyncRequest();

		const implementedFunctions = options?.functions?.reduce( ( acc, { name, implementation } ) => {
			return {
				...acc,
				[ name ]: implementation,
			};
		}, {} );

		/*
		 * If the site requires an upgrade to use the feature,
		 * let's set the error and return an `undefined` event source.
		 */
		if ( requireUpgrade ) {
			setRequestState( 'error' );
			setIsLoadingCompletion( false );
			setWasCompletionJustRequested( false );
			setShowRetry( false );
			setError( {
				code: 'error_quota_exceeded',
				message: __( 'You have reached the limit of requests for this site.', 'jetpack' ),
				status: 'info',
			} );

			return;
		}

		options = {
			retryRequest: false,
			tone: DEFAULT_PROMPT_TONE,
			...options,
		};

		if ( isLoadingCompletion ) {
			return;
		}

		setShowRetry( false );
		setError( {} );

		let prompt = lastPrompt;

		tracks.recordEvent( 'jetpack_ai_chat_completion', {
			post_id: postId,
		} );

		// Create a copy of the messages.
		const updatedMessages = [ ...attributes.messages ] ?? [];

		let lastUserPrompt = {};

		if ( ! options.retryRequest ) {
			const allPostContent = ! attributes?.isLayoutBuldingModeEnable
				? getContentFromBlocks()
				: getTextContentFromInnerBlocks( clientId );

			// If there is a content already, let's iterate over it.
			prompt = buildPromptForBlock( {
				generatedContent: content,
				allPostContent,
				postContentAbove: getPartialContentToBlock( clientId ),
				currentPostTitle,
				options,
				userPrompt,
				type,
				isGeneratingTitle: attributes.promptType === 'generateTitle',
				useGutenbergSyntax: !! attributes?.useGutenbergSyntax,
				customSystemPrompt: attributes?.customSystemPrompt,
			} );

			/*
			 * Pop the last item from the messages array,
			 * which is the fresh `user` request by convention.
			 */
			lastUserPrompt = prompt.pop();

			// Populate prompt with the messages.
			prompt = [ ...prompt, ...updatedMessages ];

			// Restore the last user prompt.
			prompt.push( lastUserPrompt );

			// Store the last prompt to be used when retrying.
			setLastPrompt( prompt );

			// If it is a title generation, keep the prompt type in subsequent changes.
			if ( attributes.promptType !== 'generateTitle' ) {
				updateBlockAttributes( clientId, { promptType: type } );
			}
		} else {
			lastUserPrompt = prompt[ prompt.length - 1 ];
		}

		try {
			setIsLoadingCompletion( true );
			setWasCompletionJustRequested( true );
			// debug all prompt items, one by one
			prompt.forEach( ( { role, content: promptContent }, i ) =>
				debugPrompt( '(%s/%s) %o\n%s', i + 1, prompt.length, `[${ role }]`, promptContent )
			);

			setRequestState( 'requesting' );

			source.current = await askQuestion( prompt, {
				postId,
				requireUpgrade,
				feature: attributes?.useGpt4 ? 'ai-assistant-experimental' : 'ai-assistant',
				functions: options?.functions,
			} );

			setRequestState( 'suggesting' );
		} catch ( err ) {
			if ( err.message ) {
				setError( { message: err.message, code: err?.code || 'unknown', status: 'error' } );
			} else {
				setError( {
					message: __(
						'Whoops, we have encountered an error. AI is like really, really hard and this is an experimental feature. Please try again later.',
						'jetpack'
					),
					code: 'unknown',
					status: 'error',
				} );
			}
			setShowRetry( true );
			setIsLoadingCompletion( false );
			setWasCompletionJustRequested( false );
		}

		const onFunctionDone = async e => {
			const { detail } = e;

			// Add assistant message with the function call request
			const assistantResponse = { role: 'assistant', content: null, function_call: detail };

			const response = await implementedFunctions[ detail.name ]?.(
				JSON.parse( detail.arguments )
			);

			// Add the function call response
			const functionResponse = {
				role: 'function',
				name: detail?.name,
				content: JSON.stringify( response ),
			};

			prompt = [ ...prompt, assistantResponse, functionResponse ];

			// Remove source.current listeners
			source?.current?.removeEventListener( 'function_done', onFunctionDone );
			source?.current?.removeEventListener( 'done', onDone );
			source?.current?.removeEventListener( 'error_unclear_prompt', onErrorUnclearPrompt );
			source?.current?.removeEventListener( 'error_network', onErrorNetwork );
			source?.current?.removeEventListener( 'error_context_too_large', onErrorContextTooLarge );
			source?.current?.removeEventListener(
				'error_service_unavailable',
				onErrorServiceUnavailable
			);
			source?.current?.removeEventListener( 'error_quota_exceeded', onErrorQuotaExceeded );
			source?.current?.removeEventListener( 'error_moderation', onErrorModeration );
			source?.current?.removeEventListener( 'suggestion', onSuggestion );

			source.current = await askQuestion( prompt, {
				postId,
				requireUpgrade,
				feature: attributes?.useGpt4 ? 'ai-assistant-experimental' : null,
				functions: options.functions,
			} );

			// Add the listeners back
			source?.current?.addEventListener( 'function_done', onFunctionDone );
			source?.current?.addEventListener( 'done', onDone );
			source?.current?.addEventListener( 'error_unclear_prompt', onErrorUnclearPrompt );
			source?.current?.addEventListener( 'error_network', onErrorNetwork );
			source?.current?.addEventListener( 'error_context_too_large', onErrorContextTooLarge );
			source?.current?.addEventListener( 'error_service_unavailable', onErrorServiceUnavailable );
			source?.current?.addEventListener( 'error_quota_exceeded', onErrorQuotaExceeded );
			source?.current?.addEventListener( 'error_moderation', onErrorModeration );
			source?.current?.addEventListener( 'suggestion', onSuggestion );
		};

		const onDone = e => {
			const { detail } = e;

			setRequestState( 'done' );

			// Remove the delimiter from the suggestion.
			const assistantResponse = detail.replaceAll( delimiter, '' );

			// Populate the messages with the assistant response.
			const lastAssistantPrompt = {
				role: 'assistant',
				content: assistantResponse,
			};

			updatedMessages.push( lastUserPrompt, lastAssistantPrompt );

			debugPrompt( 'Add %o\n%s', `[${ lastUserPrompt.role }]`, lastUserPrompt.content );
			debugPrompt( 'Add %o\n%s', `[${ lastAssistantPrompt.role }]`, lastAssistantPrompt.content );

			/*
			 * Limit the messages to 20 items.
			 * @todo: limit the prompt based on tokens.
			 */
			if ( updatedMessages.length > 20 ) {
				updatedMessages.splice( 0, updatedMessages.length - 20 );
			}

			stopSuggestion();

			const useGutenbergSyntax = attributes?.useGutenbergSyntax;

			updateBlockAttributes( clientId, {
				content: assistantResponse,
				messages: updatedMessages,
			} );

			if ( ! useGutenbergSyntax ) {
				return;
			}

			// POC for layout prompts:
			// Generates the list of blocks from the generated code
			const { replaceInnerBlocks } = dispatch( 'core/block-editor' );
			const blocks = parse( detail );
			const validBlocks = blocks.filter( block => block.isValid );
			replaceInnerBlocks( clientId, validBlocks );
		};

		const onErrorUnclearPrompt = () => {
			setRequestState( 'error' );
			source?.current?.close();
			setIsLoadingCompletion( false );
			setWasCompletionJustRequested( false );
			setError( {
				code: 'error_unclear_prompt',
				message: __( 'Your request was unclear. Mind trying again?', 'jetpack' ),
				status: 'info',
			} );
			onUnclearPrompt?.();
		};

		const onErrorContextTooLarge = () => {
			setRequestState( 'error' );
			source?.current?.close();
			setIsLoadingCompletion( false );
			setWasCompletionJustRequested( false );
			setShowRetry( false );
			setError( {
				code: 'error_context_too_large',
				message: __(
					'The content is too large to be processed all at once. Please try to shorten it or divide it into smaller parts.',
					'jetpack'
				),
				status: 'info',
			} );
		};

		const onErrorNetwork = ( { detail: error } ) => {
			setRequestState( 'error' );
			const { name: errorName, message: errorMessage } = error;
			if ( errorName === 'TypeError' && errorMessage === 'Failed to fetch' ) {
				/*
				 * This is a network error.
				 * Probably: "414 Request-URI Too Large".
				 * Let's clean up the messages array and try again.
				 * @todo: improve the process based on tokens / URL length.
				 */
				updatedMessages.splice( 0, 8 );
				updateBlockAttributes( clientId, {
					messages: updatedMessages,
				} );

				/*
				 * Update the last prompt with the new messages.
				 * @todo: Iterate over Prompt library to address properly the messages.
				 */
				prompt = buildPromptForBlock( {
					generatedContent: content,
					allPostContent: getContentFromBlocks(),
					postContentAbove: getPartialContentToBlock( clientId ),
					currentPostTitle,
					options,
					userPrompt,
					type,
					isGeneratingTitle: attributes.promptType === 'generateTitle',
					useGutenbergSyntax: !! attributes?.useGutenbergSyntax,
					customSystemPrompt: attributes?.customSystemPrompt,
				} );

				setLastPrompt( [ ...prompt, ...updatedMessages, lastUserPrompt ] );
			}

			source?.current?.close();
			setIsLoadingCompletion( false );
			setWasCompletionJustRequested( false );
			setShowRetry( true );
			setError( {
				code: 'error_network',
				message: __( 'It was not possible to process your request. Mind trying again?', 'jetpack' ),
				status: 'info',
			} );
		};

		const onErrorServiceUnavailable = () => {
			setRequestState( 'error' );
			source?.current?.close();
			setIsLoadingCompletion( false );
			setWasCompletionJustRequested( false );
			setShowRetry( true );
			setError( {
				code: 'error_service_unavailable',
				message: __(
					'Jetpack AI services are currently unavailable. Sorry for the inconvenience.',
					'jetpack'
				),
				status: 'info',
			} );
		};

		const onErrorQuotaExceeded = () => {
			setRequestState( 'error' );
			source?.current?.close();
			setIsLoadingCompletion( false );
			setWasCompletionJustRequested( false );
			setShowRetry( false );

			// Dispatch the action to set the feature as requiring an upgrade.
			setAiAssistantFeatureRequireUpgrade( true );

			setError( {
				code: 'error_quota_exceeded',
				message: __( 'You have reached the limit of requests for this site.', 'jetpack' ),
				status: 'info',
			} );
		};

		const onErrorModeration = () => {
			setRequestState( 'error' );
			source?.current?.close();
			setIsLoadingCompletion( false );
			setWasCompletionJustRequested( false );
			setShowRetry( false );
			setError( {
				code: 'error_moderation',
				message: __(
					'This request has been flagged by our moderation system. Please try to rephrase it and try again.',
					'jetpack'
				),
				status: 'info',
			} );
			onModeration?.();
		};

		const onSuggestion = e => {
			setWasCompletionJustRequested( false );
			debug( '(suggestion)', e?.detail );

			/*
			 * Progressive blocks rendering process.
			 * ToDo: Interesting challenge. Let's comment for now.
			 */

			// let's get valid HTML by using a temporary dom element
			// const temp = document.createElement( 'div' );
			// temp.innerHTML = e?.detail;

			// // Now, we are ready to create blocks from the valid HTML.
			// const blocks = rawHandler( { HTML: temp.innerHTML } );
			// const validBlocks = blocks.filter( block => block.isValid );

			// const { replaceInnerBlocks } = dispatch( 'core/block-editor' );
			// replaceInnerBlocks( clientId, validBlocks );

			// Remove the delimiter from the suggestion and update the block.
			updateBlockAttributes( clientId, { content: e?.detail?.replaceAll( delimiter, '' ) } );
		};

		source?.current?.addEventListener( 'function_done', onFunctionDone );
		source?.current?.addEventListener( 'done', onDone );
		source?.current?.addEventListener( 'error_unclear_prompt', onErrorUnclearPrompt );
		source?.current?.addEventListener( 'error_network', onErrorNetwork );
		source?.current?.addEventListener( 'error_context_too_large', onErrorContextTooLarge );
		source?.current?.addEventListener( 'error_service_unavailable', onErrorServiceUnavailable );
		source?.current?.addEventListener( 'error_quota_exceeded', onErrorQuotaExceeded );
		source?.current?.addEventListener( 'error_moderation', onErrorModeration );
		source?.current?.addEventListener( 'suggestion', onSuggestion );

		return source?.current;
	};

	function stopSuggestion() {
		if ( ! source?.current ) {
			return;
		}

		source?.current?.close();
		setIsLoadingCompletion( false );
		setWasCompletionJustRequested( false );
		onSuggestionDone?.();

		// Set requesting state to done since the suggestion stopped.
		setRequestState( 'done' );
	}

	return {
		isLoadingCategories,
		isLoadingCompletion,
		wasCompletionJustRequested,
		setIsLoadingCategories,
		setShowRetry,
		showRetry,
		postTitle: currentPostTitle,
		contentBefore: getPartialContentToBlock( clientId ),
		wholeContent: getContentFromBlocks(),
		requestingState: requestState,

		getSuggestionFromOpenAI: getStreamedSuggestionFromOpenAI,
		stopSuggestion,
		retryRequest: () => getStreamedSuggestionFromOpenAI( '', { retryRequest: true } ),
	};
};

export default useSuggestionsFromOpenAI;
