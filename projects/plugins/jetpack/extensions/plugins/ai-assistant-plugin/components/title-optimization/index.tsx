/**
 * External dependencies
 */
import {
	createClient,
	createJetpackAuthProvider,
	createTextMessage,
	extractToolCallsFromMessage,
	extractTextFromMessage,
} from '@automattic/agenttic-client';
import {
	ERROR_CONTEXT_TOO_LARGE,
	RequestingErrorProps,
	ERROR_QUOTA_EXCEEDED,
	ERROR_NETWORK,
	ERROR_SERVICE_UNAVAILABLE,
	ERROR_UNCLEAR_PROMPT,
	QuotaExceededMessage,
	usePostContent,
	AiAssistantModal,
} from '@automattic/jetpack-ai-client';
import { useAnalytics, useAutosaveAndRedirect } from '@automattic/jetpack-shared-extension-utils';
import { Button, Spinner, ExternalLink, Notice } from '@wordpress/components';
import { useDispatch, useSelect } from '@wordpress/data';
import { useState, useCallback, useEffect, useRef } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
/**
 * Internal dependencies
 */
import { getFeatureAvailability } from '../../../../blocks/ai-assistant/lib/utils/get-feature-availability';
import TitleOptimizationKeywords from './title-optimization-keywords';
import TitleOptimizationOptions from './title-optimization-options';
import type { Client, TaskUpdate } from '@automattic/agenttic-client';
import './style.scss';

/**
 * Determine if the AI Title Optimization Keywords feature is available.
 */
const isKeywordsFeatureAvailable = getFeatureAvailability(
	'ai-title-optimization-keywords-support'
);

/**
 * A generic error message that we can reuse.
 */
const genericErrorMessage = __(
	'The generation of your suggested titles failed. Please try again.',
	'jetpack'
);

const ERROR_JSON_PARSE = 'json-parse-error';

/**
 * wp-orchestrator constants matching the ability registered in
 * class-title-optimization-ability.php.
 */
const ORCHESTRATOR_AGENT_ID = 'wp-orchestrator';
const ABILITY_NAME = 'wpcom/optimize-title';
const FEATURE_NAME = 'jetpack-ai-title-optimization';

/**
 * Get the numeric blog ID from editor state.
 * @return {string} The blog ID or empty string if unavailable.
 */
function getNumericBlogId(): string {
	return (
		window?.Jetpack_Editor_Initial_State?.wpcomBlogId ||
		window?.JP_CONNECTION_INITIAL_STATE?.siteSuffix ||
		''
	);
}

type TitleOptimizationOption = {
	title: string;
	explanation: string;
};

const MAX_TITLE_OPTIONS = 3;

/**
 * Parse numbered or bulleted title options from plain text.
 * @param {string} content - The text content to parse.
 * @return {TitleOptimizationOption[]} Parsed title options.
 */
function parseNumberedTitleOptions( content: string ): TitleOptimizationOption[] {
	return content
		.split( '\n' )
		.map( line => line.trim() )
		.map( line => line.match( /^(?:\d+\)|[-*])\s+(.+)$/ ) )
		.filter( Boolean )
		.map( match => ( {
			title: match?.[ 1 ]?.trim() || '',
			explanation: '',
		} ) )
		.filter( option => option.title.length > 0 );
}

/**
 * Parse title options from JSON or plain text content.
 * @param {string} content - The content to parse, either JSON array or numbered/bulleted text.
 * @return {TitleOptimizationOption[]} Parsed title options, max 3.
 */
function parseTitleOptions( content: string ): TitleOptimizationOption[] {
	let options: TitleOptimizationOption[] = [];

	try {
		const parsedContent = JSON.parse( content ) as TitleOptimizationOption[];
		if ( Array.isArray( parsedContent ) && parsedContent.length > 0 ) {
			options = parsedContent;
		}
	} catch {
		// Fall through to numbered/bulleted text parsing below.
	}

	if ( options.length === 0 ) {
		options = parseNumberedTitleOptions( content );
	}

	return options.slice( 0, MAX_TITLE_OPTIONS );
}

type TitleOptimizationJSONError = {
	code: typeof ERROR_JSON_PARSE;
	message: string;
};

type TitleOptimizationError = RequestingErrorProps | TitleOptimizationJSONError;

/**
 * Extract HTTP status code from agenttic-client error messages.
 * The client throws errors like "HTTP error! status: 503".
 * @param {unknown} error - The error to extract the status from.
 * @return {number|undefined} The HTTP status code, or undefined if not found.
 */
function getStatusFromError( error: unknown ): number | undefined {
	if ( error instanceof Error ) {
		const match = error.message.match( /status:\s*(\d+)/ );
		if ( match ) {
			return parseInt( match[ 1 ], 10 );
		}
	}
	return undefined;
}

/**
 * Map an HTTP status code to an error object.
 * @param {number} status - The HTTP status code.
 * @return {RequestingErrorProps} The mapped error.
 */
function getErrorFromStatus( status?: number ): RequestingErrorProps {
	if ( status === 429 ) {
		return {
			code: ERROR_QUOTA_EXCEEDED,
			message: '',
			severity: 'info',
		};
	}

	if ( status === 503 ) {
		return {
			code: ERROR_SERVICE_UNAVAILABLE,
			message: genericErrorMessage,
			severity: 'info',
		};
	}

	if ( status === 413 ) {
		return {
			code: ERROR_CONTEXT_TOO_LARGE,
			message: genericErrorMessage,
			severity: 'info',
		};
	}

	if ( status === 422 ) {
		return {
			code: ERROR_UNCLEAR_PROMPT,
			message: genericErrorMessage,
			severity: 'info',
		};
	}

	return {
		code: ERROR_NETWORK,
		message: genericErrorMessage,
		severity: 'info',
	};
}

/**
 * Error handler for the Jetpack auth provider.
 * @return {string} The error message.
 */
function handleAuthError(): string {
	return genericErrorMessage;
}

/**
 * Extract title options from an agenttic-client TaskUpdate response.
 * Checks for wpcom__optimize_title tool call data first, then falls back to text.
 * @param {TaskUpdate} response - The agenttic-client task update response.
 * @return {string} JSON string of titles or plain text content.
 */
function extractTitlesFromResponse( response: TaskUpdate ): string {
	const message = response.status?.message;
	if ( ! message ) {
		return response.text || '';
	}

	// Check for tool call with title data
	const toolCalls = extractToolCallsFromMessage( message );
	const titleToolCall = toolCalls.find( tc => tc.data?.toolId === 'wpcom__optimize_title' );

	if ( titleToolCall?.data?.arguments?.titles ) {
		return JSON.stringify( titleToolCall.data.arguments.titles );
	}

	// Fallback to text content
	return extractTextFromMessage( message );
}

const TitleOptimizationErrorMessage = ( { error }: { error: TitleOptimizationError } ) => {
	if ( error.code === ERROR_QUOTA_EXCEEDED ) {
		return (
			<div className="jetpack-ai-title-optimization__error">
				<QuotaExceededMessage useLightNudge={ true } />
			</div>
		);
	}

	// Use the provided message, if available, otherwise use the generic error message
	const errorMessage = error.message ? error.message : genericErrorMessage;

	return (
		<div className="jetpack-ai-title-optimization__error">
			<Notice status="error" isDismissible={ false }>
				{ errorMessage }
			</Notice>
		</div>
	);
};

/**
 * Title optimization component for the AI assistant plugin sidebar.
 * @param {object}  props           - Component props.
 * @param {string}  props.placement - Placement context for analytics.
 * @param {boolean} props.busy      - Whether the button should show a busy state.
 * @param {boolean} props.disabled  - Whether the button should be disabled.
 * @return {import('react').ReactElement} The rendered component.
 */
export default function TitleOptimization( {
	placement,
	busy,
	disabled,
}: {
	placement: string;
	busy: boolean;
	disabled: boolean;
} ) {
	const currentModalTitle = __( 'Optimize post title', 'jetpack' );
	const SEOModalTitle = __( 'Improve title for SEO', 'jetpack' );
	const modalTitle = isKeywordsFeatureAvailable ? SEOModalTitle : currentModalTitle;

	const currentSidebarDescription = __( 'Based on your post content.', 'jetpack' );
	const SEOSidebarDescription = __(
		'Based on your post content and SEO best practices.',
		'jetpack'
	);
	const sidebarDescription = isKeywordsFeatureAvailable
		? SEOSidebarDescription
		: currentSidebarDescription;

	const currentSidebarButtonLabel = __( 'Generate title options', 'jetpack' );
	const SEOSidebarButtonLabel = __( 'Generate title options', 'jetpack' );
	const sidebarButtonLabel = isKeywordsFeatureAvailable
		? SEOSidebarButtonLabel
		: currentSidebarButtonLabel;

	const { getPostContent, isEditedPostEmpty } = usePostContent();
	const [ selected, setSelected ] = useState( null );
	const [ isTitleOptimizationModalVisible, setIsTitleOptimizationModalVisible ] = useState( false );
	const [ generating, setGenerating ] = useState( false );
	const [ options, setOptions ] = useState( [] );
	const [ error, setError ] = useState< TitleOptimizationError | null >( null );
	const [ optimizationKeywords, setOptimizationKeywords ] = useState( '' );
	const [ requestStartedAt, setRequestStartedAt ] = useState< number | null >( null );
	const [ elapsedSeconds, setElapsedSeconds ] = useState( 0 );
	const { editPost } = useDispatch( 'core/editor' );
	const postId = useSelect(
		select => ( select( 'core/editor' ) as { getCurrentPostId: () => number } ).getCurrentPostId(),
		[]
	);
	const { autosave } = useAutosaveAndRedirect();
	const { increaseAiAssistantRequestsCount } = useDispatch( 'wordpress-com/plans' );
	const { tracks } = useAnalytics();
	const { recordEvent } = tracks;

	// Lazily create the agenttic client. The blogId comes from editor state.
	// Client is not cached until a valid blogId is available so that late-loading
	// editor state doesn't produce a permanently misconfigured client.
	const clientRef = useRef< Client | null >( null );
	const getClient = useCallback( (): Client => {
		const blogId = getNumericBlogId();
		if ( ! blogId ) {
			throw new Error( 'Blog ID not available' );
		}
		if ( ! clientRef.current ) {
			clientRef.current = createClient( {
				agentId: ORCHESTRATOR_AGENT_ID,
				agentUrl: `https://public-api.wordpress.com/wpcom/v2/sites/${ blogId }/ai/agent`,
				authProvider: createJetpackAuthProvider( handleAuthError ),
			} );
		}
		return clientRef.current;
	}, [] );

	useEffect( () => {
		if ( ! generating || ! requestStartedAt ) {
			setElapsedSeconds( 0 );
			return;
		}

		const intervalId = window.setInterval( () => {
			setElapsedSeconds( Math.max( 0, Math.floor( ( Date.now() - requestStartedAt ) / 1000 ) ) );
		}, 250 );

		return () => window.clearInterval( intervalId );
	}, [ generating, requestStartedAt ] );

	const toggleTitleOptimizationModal = useCallback( () => {
		setIsTitleOptimizationModalVisible( ! isTitleOptimizationModalVisible );
	}, [ isTitleOptimizationModalVisible ] );

	const handleDone = useCallback(
		( content: string ) => {
			setGenerating( false );
			setRequestStartedAt( null );
			increaseAiAssistantRequestsCount();

			const parsedContent = parseTitleOptions( content );
			if ( parsedContent.length > 0 ) {
				setOptions( parsedContent );
				setSelected( parsedContent?.[ 0 ]?.title );
			} else {
				const jsonError: TitleOptimizationJSONError = {
					code: ERROR_JSON_PARSE,
					message: genericErrorMessage,
				};
				setError( jsonError );
			}
		},
		[ increaseAiAssistantRequestsCount ]
	);

	const handleRequest = useCallback(
		async ( isRetry: boolean = false ) => {
			// track the generate title optimization options
			recordEvent( 'jetpack_ai_title_optimization_generate', {
				placement,
				has_keywords: !! optimizationKeywords,
				is_retry: isRetry, // track if the user is retrying the generation
			} );

			setGenerating( true );
			setRequestStartedAt( Date.now() );
			setError( null );
			try {
				const client = getClient();
				const content = getPostContent();
				const numericBlogId = getNumericBlogId();

				const message = createTextMessage(
					JSON.stringify( {
						ability: ABILITY_NAME,
						feature: FEATURE_NAME,
						site_id: Number( numericBlogId ),
						mode: 'ui',
						content,
						keywords: optimizationKeywords,
						...( postId ? { post_id: postId } : {} ),
					} )
				);

				const response = await client.sendMessage( { message } );

				if ( response.status?.state === 'failed' ) {
					setError( getErrorFromStatus() );
					setGenerating( false );
					setRequestStartedAt( null );
					return;
				}

				const titlesContent = extractTitlesFromResponse( response );
				handleDone( titlesContent );
			} catch ( e ) {
				const status = getStatusFromError( e );
				setError( getErrorFromStatus( status ) );
				setGenerating( false );
				setRequestStartedAt( null );
			}
		},
		[ recordEvent, placement, getPostContent, optimizationKeywords, postId, handleDone, getClient ]
	);

	const handleTitleOptimization = useCallback( () => {
		toggleTitleOptimizationModal();
		handleRequest();
	}, [ handleRequest, toggleTitleOptimizationModal ] );

	const handleTryAgain = useCallback( () => {
		setError( null );

		/**
		 * Only try to generate again if there are no options available.
		 * If there are options, show them so the user can choose one
		 * or ask for new suggestions.
		 */
		if ( options.length === 0 ) {
			handleRequest( true ); // retry the generation
		}
	}, [ handleRequest, options ] );

	const handleTitleOptimizationWithKeywords = useCallback( () => {
		handleRequest();
	}, [ handleRequest ] );

	const handleAccept = useCallback(
		( event: React.MouseEvent< HTMLButtonElement > ) => {
			// track the generated title acceptance
			recordEvent( 'jetpack_ai_title_optimization_accept', {
				placement,
			} );

			editPost( { title: selected } );
			toggleTitleOptimizationModal();

			try {
				autosave( event );
			} catch {
				// Do nothing since the user can save manually
			}
		},
		[ autosave, editPost, placement, recordEvent, selected, toggleTitleOptimizationModal ]
	);

	const handleClose = useCallback( () => {
		setError( null );
		toggleTitleOptimizationModal();
		setOptimizationKeywords( '' );
	}, [ toggleTitleOptimizationModal ] );

	const handleOptionChange = useCallback(
		( e: React.ChangeEvent< HTMLInputElement > ) => setSelected( e.target.value ),
		[]
	);

	// When can we retry?
	const showTryAgainButton =
		error &&
		[ ERROR_JSON_PARSE, ERROR_NETWORK, ERROR_SERVICE_UNAVAILABLE, ERROR_UNCLEAR_PROMPT ].includes(
			error.code
		);
	const showReplaceTitleButton = ! error;

	return (
		<div>
			<p className="jetpack-ai-assistant__help-text">{ sidebarDescription }</p>
			<Button
				isBusy={ busy }
				disabled={ isEditedPostEmpty() || disabled }
				onClick={ handleTitleOptimization }
				variant="secondary"
				__next40pxDefaultSize
			>
				{ sidebarButtonLabel }
			</Button>
			{ isTitleOptimizationModalVisible && (
				<AiAssistantModal
					handleClose={ handleClose }
					title={ modalTitle }
					maxWidth={ isKeywordsFeatureAvailable ? 700 : 512 }
				>
					{ generating ? (
						<div className="jetpack-ai-title-optimization__loading">
							<Spinner
								style={ {
									width: '50px',
									height: '50px',
								} }
							/>
							{ `${ __(
								'Reading your post and generating suggestions…',
								'jetpack'
							) } (${ elapsedSeconds }s)` }
						</div>
					) : (
						<>
							{ error ? (
								<TitleOptimizationErrorMessage error={ error } />
							) : (
								<>
									{ isKeywordsFeatureAvailable && (
										<TitleOptimizationKeywords
											onGenerate={ handleTitleOptimizationWithKeywords }
											onKeywordsChange={ setOptimizationKeywords }
											disabled={ generating }
											currentKeywords={ optimizationKeywords }
										/>
									) }
									{ ! isKeywordsFeatureAvailable && (
										<span className="jetpack-ai-title-optimization__intro">
											{ __( 'Choose an optimized title below:', 'jetpack' ) }
										</span>
									) }
									<TitleOptimizationOptions
										onChangeValue={ handleOptionChange }
										selected={ selected }
										options={ options?.map?.( option => ( {
											value: option.title,
											label: option.title,
											description: option.explanation,
										} ) ) }
									/>
								</>
							) }
							<div className="jetpack-ai-title-optimization__cta">
								<Button variant="secondary" onClick={ handleClose }>
									{ __( 'Cancel', 'jetpack' ) }
								</Button>
								{ showTryAgainButton && (
									<Button variant="primary" onClick={ handleTryAgain }>
										{ __( 'Try again', 'jetpack' ) }
									</Button>
								) }
								{ showReplaceTitleButton && (
									<Button variant="primary" onClick={ handleAccept }>
										{ __( 'Replace title', 'jetpack' ) }
									</Button>
								) }
							</div>
						</>
					) }
					<div className="jetpack-ai-title-optimization__footer">
						<ExternalLink href="https://jetpack.com/redirect/?source=jetpack-ai-feedback">
							{ __( 'Provide feedback', 'jetpack' ) }
						</ExternalLink>
					</div>
				</AiAssistantModal>
			) }
		</div>
	);
}
