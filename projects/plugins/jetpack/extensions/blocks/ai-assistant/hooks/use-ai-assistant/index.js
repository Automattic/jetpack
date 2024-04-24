/**
 * External dependencies
 */
import {
	useAiSuggestions,
	ERROR_CONTEXT_TOO_LARGE,
	ERROR_MODERATION,
	ERROR_NETWORK,
	ERROR_QUOTA_EXCEEDED,
	ERROR_SERVICE_UNAVAILABLE,
	ERROR_UNCLEAR_PROMPT,
} from '@automattic/jetpack-ai-client';
import { useSelect, useDispatch } from '@wordpress/data';
import { useState, useRef } from '@wordpress/element';
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
import useAutoScroll from '../use-auto-scroll';

const debugError = debugFactory( 'jetpack-ai-assistant:error' );

const useAIAssistant = ( {
	attributes,
	clientId,
	content,
	tracks,
	userPrompt,
	onSuggestionDone,
	onUnclearPrompt,
	onModeration,
	requireUpgrade,
	initialRequestingState,
	contentRef,
	blockRef,
} ) => {
	const [ showRetry, setShowRetry ] = useState( false );
	const [ lastPrompt, setLastPrompt ] = useState( '' );
	const { updateBlockAttributes } = useDispatch( 'core/block-editor' );
	const { dequeueAiAssistantFeatureAsyncRequest, setAiAssistantFeatureRequireUpgrade } =
		useDispatch( 'wordpress-com/plans' );

	const { snapToBottom, enableAutoScroll, disableAutoScroll } = useAutoScroll(
		blockRef,
		contentRef
	);

	// Let's grab post data so that we can do something smart.
	const currentPostTitle = useSelect( select =>
		select( 'core/editor' ).getEditedPostAttribute( 'title' )
	);

	const postId = useSelect( select => select( 'core/editor' ).getCurrentPostId() );

	const updatedMessages = useRef( [] );
	const lastUserPrompt = useRef();

	const onSuggestion = detail => {
		// Remove the delimiter from the suggestion and update the block.
		updateBlockAttributes( clientId, { content: detail?.replaceAll( delimiter, '' ) } );
		snapToBottom();
	};

	const onDone = detail => {
		// Remove the delimiter from the suggestion.
		const assistantResponse = detail.replaceAll( delimiter, '' );

		// Populate the messages with the assistant response.
		const lastAssistantPrompt = {
			role: 'assistant',
			content: assistantResponse,
		};

		updatedMessages.current.push( lastUserPrompt.current, lastAssistantPrompt );

		/*
		 * Limit the messages to 20 items.
		 * @todo: limit the prompt based on tokens.
		 */
		if ( updatedMessages.current.length > 20 ) {
			updatedMessages.current.splice( 0, updatedMessages.current.length - 20 );
		}

		updateBlockAttributes( clientId, {
			content: assistantResponse,
			messages: updatedMessages.current,
		} );

		snapToBottom();
		disableAutoScroll();
		onSuggestionDone?.();
	};

	const onStop = () => {
		snapToBottom();
		disableAutoScroll();
		onSuggestionDone?.();
	};

	const onError = detail => {
		switch ( detail?.code ) {
			case ERROR_CONTEXT_TOO_LARGE:
				setShowRetry( false );
				break;
			case ERROR_MODERATION:
				setShowRetry( false );
				onModeration?.();
				break;
			case ERROR_NETWORK:
			case ERROR_SERVICE_UNAVAILABLE:
				setShowRetry( true );
				break;
			case ERROR_QUOTA_EXCEEDED:
				setShowRetry( false );
				// Dispatch the action to set the feature as requiring an upgrade.
				setAiAssistantFeatureRequireUpgrade( true );
				break;
			case ERROR_UNCLEAR_PROMPT:
				onUnclearPrompt?.();
				break;
			default:
				break;
		}
	};

	const onAllErrors = detail => {
		debugError( detail );
	};

	const { request, stopSuggestion, handleErrorQuotaExceededError, requestingState, error } =
		useAiSuggestions( {
			onSuggestion,
			onDone,
			onStop,
			onError,
			onAllErrors,
			initialRequestingState,
			askQuestionOptions: {
				postId,
				feature: 'ai-assistant',
				functions: {},
			},
		} );

	const isLoadingCompletion = [ 'requesting', 'suggesting' ].includes( requestingState );

	const getStreamedSuggestionFromOpenAI = async ( type, options = {} ) => {
		/*
		 * Always dequeue/cancel the AI Assistant feature async request,
		 * in case there is one pending,
		 * when performing a new AI suggestion request.
		 */
		dequeueAiAssistantFeatureAsyncRequest();

		/*
		 * If the site requires an upgrade to use the feature,
		 * let's set the error and return an `undefined` event source.
		 */
		if ( requireUpgrade ) {
			handleErrorQuotaExceededError();
			setShowRetry( false );

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

		let prompt = lastPrompt;

		tracks.recordEvent( 'jetpack_ai_chat_completion', {
			post_id: postId,
		} );

		// Create a copy of the messages.
		updatedMessages.current = [ ...attributes.messages ] ?? [];

		lastUserPrompt.current = {};

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
				userPrompt: options?.userPrompt || userPrompt,
				type,
				isGeneratingTitle: attributes.promptType === 'generateTitle',
			} );

			/*
			 * Pop the last item from the messages array,
			 * which is the fresh `user` request by convention.
			 */
			lastUserPrompt.current = prompt.pop();

			// Populate prompt with the messages.
			prompt = [ ...prompt, ...updatedMessages.current ];

			// Restore the last user prompt.
			prompt.push( lastUserPrompt.current );

			// Store the last prompt to be used when retrying.
			setLastPrompt( prompt );

			// If it is a title generation, keep the prompt type in subsequent changes.
			if ( attributes.promptType !== 'generateTitle' ) {
				updateBlockAttributes( clientId, { promptType: type } );
			}
		} else {
			lastUserPrompt.current = prompt[ prompt.length - 1 ];
		}

		try {
			enableAutoScroll();

			await request( prompt );
		} catch ( err ) {
			debugError( err );
			setShowRetry( true );
			disableAutoScroll();
		}
	};

	return {
		setShowRetry,
		showRetry,
		postTitle: currentPostTitle,
		contentBefore: getPartialContentToBlock( clientId ),
		wholeContent: getContentFromBlocks(),
		requestingState,
		error,

		getSuggestionFromOpenAI: getStreamedSuggestionFromOpenAI,
		stopSuggestion,
		retryRequest: () => getStreamedSuggestionFromOpenAI( '', { retryRequest: true } ),
	};
};

export default useAIAssistant;
