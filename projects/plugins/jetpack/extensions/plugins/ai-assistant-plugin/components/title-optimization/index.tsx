/**
 * External dependencies
 */
import { useAiSuggestions } from '@automattic/jetpack-ai-client';
import { useAnalytics } from '@automattic/jetpack-shared-extension-utils';
import { Button, Spinner, ExternalLink } from '@wordpress/components';
import { useDispatch } from '@wordpress/data';
import { useState, useCallback } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
/**
 * Internal dependencies
 */
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

	const currentSidebarDescription = __( 'Use AI to optimize key details of your post.', 'jetpack' );
	const SEOSidebarDescription = __(
		'AI suggested titles based on your content and keywords for better SEO results.',
		'jetpack'
	);
	const sidebarDescription = isKeywordsFeatureAvailable
		? SEOSidebarDescription
		: currentSidebarDescription;

	const currentSidebarButtonLabel = __( 'Improve title', 'jetpack' );
	const SEOSidebarButtonLabel = __( 'Improve title for SEO', 'jetpack' );
	const sidebarButtonLabel = isKeywordsFeatureAvailable
		? SEOSidebarButtonLabel
		: currentSidebarButtonLabel;

	const postContent = usePostContent();
	const [ selected, setSelected ] = useState( null );
	const [ isTitleOptimizationModalVisible, setIsTitleOptimizationModalVisible ] = useState( false );
	const [ generating, setGenerating ] = useState( false );
	const [ options, setOptions ] = useState( [] );
	const [ error, setError ] = useState( false );
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
			} catch ( e ) {
				// Do nothing
			}
		},
		[ increaseAiAssistantRequestsCount ]
	);

	const { request, stopSuggestion } = useAiSuggestions( {
		onDone: handleDone,
		onError: () => {
			setError( true );
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
		setError( false );
		handleRequest( true ); // retry the generation
	}, [ handleRequest ] );

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
			} catch ( e ) {
				// Do nothing since the user can save manually
			}
		},
		[ autosave, editPost, placement, recordEvent, selected, toggleTitleOptimizationModal ]
	);

	const handleClose = useCallback( () => {
		toggleTitleOptimizationModal();
		setOptimizationKeywords( '' );
		stopSuggestion();
	}, [ stopSuggestion, toggleTitleOptimizationModal ] );

	return (
		<div>
			<p>{ sidebarDescription }</p>
			<Button
				isBusy={ busy }
				disabled={ ! postContent || disabled }
				onClick={ handleTitleOptimization }
				variant="secondary"
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
								<div className="jetpack-ai-title-optimization__error">
									{ __(
										'The generation of your suggested titles failed. Please try again.',
										'jetpack'
									) }
								</div>
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
								<Button variant="secondary" onClick={ toggleTitleOptimizationModal }>
									{ __( 'Cancel', 'jetpack' ) }
								</Button>
								{ error ? (
									<Button variant="primary" onClick={ handleTryAgain }>
										{ __( 'Try again', 'jetpack' ) }
									</Button>
								) : (
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
