/**
 * External dependencies
 */
import {
	useAiSuggestions,
	RequestingErrorProps,
	ERROR_QUOTA_EXCEEDED,
	ERROR_NETWORK,
	ERROR_SERVICE_UNAVAILABLE,
	ERROR_UNCLEAR_PROMPT,
} from '@automattic/jetpack-ai-client';
import { useAnalytics } from '@automattic/jetpack-shared-extension-utils';
import { Button, Spinner, ExternalLink, Notice } from '@wordpress/components';
import { useDispatch } from '@wordpress/data';
import { useState, useCallback } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
/**
 * Internal dependencies
 */
import QuotaExceededMessage from '../../../../blocks/ai-assistant/components/quota-exceeded-message';
import { getFeatureAvailability } from '../../../../blocks/ai-assistant/lib/utils/get-feature-availability';
import useAutoSaveAndRedirect from '../../../../shared/use-autosave-and-redirect';
import usePostContent from '../../hooks/use-post-content';
import AiAssistantModal from '../modal';
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
type TitleOptimizationJSONError = {
	code: typeof ERROR_JSON_PARSE;
	message: string;
};

type TitleOptimizationError = RequestingErrorProps | TitleOptimizationJSONError;

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

	const postContent = usePostContent();
	const [ selected, setSelected ] = useState( null );
	const [ isTitleOptimizationModalVisible, setIsTitleOptimizationModalVisible ] = useState( false );
	const [ generating, setGenerating ] = useState( false );
	const [ options, setOptions ] = useState( [] );
	const [ error, setError ] = useState< TitleOptimizationError | null >( null );
	const [ optimizationKeywords, setOptimizationKeywords ] = useState( '' );
	const { editPost } = useDispatch( 'core/editor' );
	const { autosave } = useAutoSaveAndRedirect();
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

	const { request, stopSuggestion } = useAiSuggestions( {
		onDone: handleDone,
		onError: ( e: RequestingErrorProps ) => {
			setError( e );
			setGenerating( false );
		},
	} );

	const handleRequest = useCallback(
		( isRetry: boolean = false ) => {
			// track the generate title optimization options
			recordEvent( 'jetpack_ai_title_optimization_generate', {
				placement,
				has_keywords: !! optimizationKeywords,
				is_retry: isRetry, // track if the user is retrying the generation
			} );

			setGenerating( true );
			// Message to request a backend prompt for this feature
			const messages = [
				{
					role: 'jetpack-ai' as const,
					context: {
						type: 'title-optimization',
						content: postContent,
						keywords: optimizationKeywords,
					},
				},
			];

			request( messages, { feature: 'jetpack-ai-title-optimization' } );
		},
		[ recordEvent, placement, postContent, optimizationKeywords, request ]
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
		( event: MouseEvent ) => {
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
		stopSuggestion();
	}, [ stopSuggestion, toggleTitleOptimizationModal ] );

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
				disabled={ ! postContent || disabled }
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
