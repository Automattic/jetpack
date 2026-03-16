/**
 * External dependencies
 */
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
	requestJwt,
} from '@automattic/jetpack-ai-client';
import { useAnalytics, useAutosaveAndRedirect } from '@automattic/jetpack-shared-extension-utils';
import { Button, Spinner, ExternalLink, Notice } from '@wordpress/components';
import { useDispatch, useSelect } from '@wordpress/data';
import { useState, useCallback } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
/**
 * Internal dependencies
 */
import { getFeatureAvailability } from '../../../../blocks/ai-assistant/lib/utils/get-feature-availability';
import TitleOptimizationKeywords from './title-optimization-keywords';
import TitleOptimizationOptions from './title-optimization-options';
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
const ORCHESTRATOR_URL = 'https://public-api.wordpress.com/wpcom/v2/ai/agent';
const ORCHESTRATOR_AGENT_ID = 'wp-orchestrator';
const ABILITY_NAME = 'wpcom/optimize-title';
const FEATURE_NAME = 'jetpack-ai-title-optimization';
type TitleOptimizationJSONError = {
	code: typeof ERROR_JSON_PARSE;
	message: string;
};

type TitleOptimizationError = RequestingErrorProps | TitleOptimizationJSONError;

function getErrorFromApiResponse( status?: number ): RequestingErrorProps {
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
	const { editPost } = useDispatch( 'core/editor' );
	const postId = useSelect( select => select( 'core/editor' ).getCurrentPostId(), [] );
	const { autosave } = useAutosaveAndRedirect();
	const { increaseAiAssistantRequestsCount } = useDispatch( 'wordpress-com/plans' );
	const { tracks } = useAnalytics();
	const { recordEvent } = tracks;

	const toggleTitleOptimizationModal = useCallback( () => {
		setIsTitleOptimizationModalVisible( ! isTitleOptimizationModalVisible );
	}, [ isTitleOptimizationModalVisible ] );

	const handleDone = useCallback(
		( content: string ) => {
			setGenerating( false );
			increaseAiAssistantRequestsCount();

			try {
				const parsedContent = JSON.parse( content );
				setOptions( parsedContent );
				setSelected( parsedContent?.[ 0 ]?.title );
			} catch {
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
			setError( null );
			try {
				const { token, blogId } = await requestJwt();

				const content = getPostContent();
				const requestBody: Record< string, unknown > = {
					agent_id: ORCHESTRATOR_AGENT_ID,
					ability: ABILITY_NAME,
					feature: FEATURE_NAME,
					stream: false,
					site_id: Number( blogId ),
					input: {
						messages: [
							{
								role: 'jetpack-ai',
								context: {
									type: 'title-optimization',
									content,
									keywords: optimizationKeywords,
								},
							},
						],
						...( postId ? { post_id: postId } : {} ),
					},
				};

				const res = await fetch( ORCHESTRATOR_URL, {
					method: 'POST',
					headers: {
						Authorization: `Bearer ${ token }`,
						'Content-Type': 'application/json',
					},
					body: JSON.stringify( requestBody ),
				} );

				if ( ! res.ok ) {
					setError( getErrorFromApiResponse( res.status ) );
					setGenerating( false );
					return;
				}

				const data = ( await res.json() ) as {
					choices?: Array< { message?: { content?: string } } >;
				};

				handleDone( data?.choices?.[ 0 ]?.message?.content ?? '' );
			} catch ( e ) {
				const requestError = e as { status?: number; data?: { status?: number } };
				setError( getErrorFromApiResponse( requestError?.data?.status || requestError?.status ) );
				setGenerating( false );
			}
		},
		[ recordEvent, placement, getPostContent, optimizationKeywords, postId, handleDone ]
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
							{ __( 'Reading your post and generating suggestions…', 'jetpack' ) }
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
										onChangeValue={ e => setSelected( e.target.value ) }
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
