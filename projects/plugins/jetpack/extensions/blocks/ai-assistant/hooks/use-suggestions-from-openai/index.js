/**
 * External dependencies
 */
import { store as blockEditorStore } from '@wordpress/block-editor';
import { useSelect, useDispatch } from '@wordpress/data';
import { useEffect, useState, useRef } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import debugFactory from 'debug';
/**
 * Internal dependencies
 */
import { DEFAULT_PROMPT_TONE } from '../../components/tone-dropdown-control';
import { buildPromptForBlock } from '../../lib/prompt';
import { askJetpack, askQuestion } from '../../lib/suggestions';
import { getContentFromBlocks, getPartialContentToBlock } from '../../lib/utils/block-content';

const debug = debugFactory( 'jetpack-ai-assistant:event:fullMessage' );

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
	refreshFeatureData,
	requireUpgrade,
} ) => {
	const [ isLoadingCategories, setIsLoadingCategories ] = useState( false );
	const [ isLoadingCompletion, setIsLoadingCompletion ] = useState( false );
	const [ wasCompletionJustRequested, setWasCompletionJustRequested ] = useState( false );
	const [ showRetry, setShowRetry ] = useState( false );
	const [ lastPrompt, setLastPrompt ] = useState( '' );
	const { updateBlockAttributes } = useDispatch( blockEditorStore );
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
	}, [ loading ] );

	const postId = useSelect( select => select( 'core/editor' ).getCurrentPostId() );
	// eslint-disable-next-line no-unused-vars
	const categoryNames = categoryObjects
		.filter( cat => cat.id !== 1 )
		.map( ( { name } ) => name )
		.join( ', ' );
	// eslint-disable-next-line no-unused-vars
	const tagNames = tagObjects.map( ( { name } ) => name ).join( ', ' );

	const getStreamedSuggestionFromOpenAI = async ( type, options = {} ) => {
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

		if ( ! options.retryRequest ) {
			// If there is a content already, let's iterate over it.
			prompt = buildPromptForBlock( {
				generatedContent: content,
				allPostContent: getContentFromBlocks(),
				postContentAbove: getPartialContentToBlock( clientId ),
				currentPostTitle,
				options,
				userPrompt,
				type,
				isGeneratingTitle: attributes.promptType === 'generateTitle',
			} );
		}

		tracks.recordEvent( 'jetpack_ai_chat_completion', {
			post_id: postId,
		} );

		// Create a copy of the prompt history.
		const updatedPromptHistory = [ ...attributes.promptHistory ] ?? [];

		/*
		 * Pop the last item from the prompt history,
		 * which is the fresh `user` request by convention.
		 */
		const lastUserPrompt = prompt.pop();

		// Populate prompt with the prompt history.
		prompt = [ ...prompt, ...updatedPromptHistory ];

		// Restore the last user prompt.
		prompt.push( lastUserPrompt );

		if ( ! options.retryRequest ) {
			setLastPrompt( prompt );

			// Populate the prompt history with the last user prompt.
			updatedPromptHistory.push( lastUserPrompt );

			// If it is a title generation, keep the prompt type in subsequent changes.
			if ( attributes.promptType !== 'generateTitle' ) {
				updateBlockAttributes( clientId, { promptType: type } );
			}
		}

		try {
			setIsLoadingCompletion( true );
			setWasCompletionJustRequested( true );

			source.current = await askQuestion( prompt, { postId, requireUpgrade } );
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

		source?.current?.addEventListener( 'done', e => {
			const { detail: assistantResponse } = e;

			// Populate the prompt history with the assistant response.
			updatedPromptHistory.push( {
				role: 'assistant',
				content: assistantResponse,
			} );

			stopSuggestion();

			updateBlockAttributes( clientId, {
				content: assistantResponse,
				promptHistory: updatedPromptHistory,
			} );
			refreshFeatureData();
		} );

		source?.current?.addEventListener( 'error_unclear_prompt', () => {
			source?.current?.close();
			setIsLoadingCompletion( false );
			setWasCompletionJustRequested( false );
			setError( {
				code: 'error_unclear_prompt',
				message: __( 'Your request was unclear. Mind trying again?', 'jetpack' ),
				status: 'info',
			} );
			onUnclearPrompt?.();
		} );

		source?.current?.addEventListener( 'error_network', () => {
			source?.current?.close();
			setIsLoadingCompletion( false );
			setWasCompletionJustRequested( false );
			setShowRetry( true );
			setError( {
				code: 'error_network',
				message: __( 'It was not possible to process your request. Mind trying again?', 'jetpack' ),
				status: 'info',
			} );
		} );

		source?.current?.addEventListener( 'error_service_unavailable', () => {
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
		} );

		source?.current?.addEventListener( 'error_quota_exceeded', () => {
			source?.current?.close();
			setIsLoadingCompletion( false );
			setWasCompletionJustRequested( false );
			setShowRetry( false );
			setError( {
				code: 'error_quota_exceeded',
				message: __( 'You have reached the limit of requests for this site.', 'jetpack' ),
				status: 'info',
			} );
		} );

		source?.current?.addEventListener( 'error_moderation', () => {
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
		} );

		source?.current?.addEventListener( 'suggestion', e => {
			setWasCompletionJustRequested( false );
			debug( 'fullMessage', e.detail );
			updateBlockAttributes( clientId, { content: e.detail } );
		} );
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

		getSuggestionFromOpenAI: getStreamedSuggestionFromOpenAI,
		stopSuggestion,
		retryRequest: () => getStreamedSuggestionFromOpenAI( '', { retryRequest: true } ),
	};
};

export default useSuggestionsFromOpenAI;

/**
 * askJetpack is exposed just for debugging purposes
 */
window.askJetpack = askJetpack;
