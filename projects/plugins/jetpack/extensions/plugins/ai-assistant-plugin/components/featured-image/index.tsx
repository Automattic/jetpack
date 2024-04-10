/**
 * External dependencies
 */
import { useImageGenerator } from '@automattic/jetpack-ai-client';
import { useAnalytics } from '@automattic/jetpack-shared-extension-utils';
import { Button, Spinner } from '@wordpress/components';
import { useDispatch, useSelect } from '@wordpress/data';
import { useCallback, useState } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';
/**
 * Internal dependencies
 */
import './style.scss';
import UpgradePrompt from '../../../../blocks/ai-assistant/components/upgrade-prompt';
import useAiFeature from '../../../../blocks/ai-assistant/hooks/use-ai-feature';
import {
	PLAN_TYPE_FREE,
	PLAN_TYPE_TIERED,
	PLAN_TYPE_UNLIMITED,
	usePlanType,
} from '../../../../shared/use-plan-type';
import usePostContent from '../../hooks/use-post-content';
import useSaveToMediaLibrary from '../../hooks/use-save-to-media-library';
import AiAssistantModal from '../modal';
import UsageCounter from './usage-counter';

const FEATURED_IMAGE_FEATURE_NAME = 'featured-post-image';
const JETPACK_SIDEBAR_PLACEMENT = 'jetpack-sidebar';

export default function FeaturedImage( { busy, disabled }: { busy: boolean; disabled: boolean } ) {
	const { toggleEditorPanelOpened: toggleEditorPanelOpenedFromEditPost } =
		useDispatch( 'core/edit-post' );
	const { editPost, toggleEditorPanelOpened: toggleEditorPanelOpenedFromEditor } =
		useDispatch( 'core/editor' );

	const { enableComplementaryArea } = useDispatch( 'core/interface' );
	const [ isFeaturedImageModalVisible, setIsFeaturedImageModalVisible ] = useState( false );
	const [ generating, setGenerating ] = useState( false );
	const [ imageURL, setImageURL ] = useState( null );
	const [ libraryImage, setLibraryImage ] = useState( null );
	const [ error, setError ] = useState( null );
	const { generateImage } = useImageGenerator();
	const { isLoading: isSavingToMediaLibrary, saveToMediaLibrary } = useSaveToMediaLibrary();
	const { tracks } = useAnalytics();
	const { recordEvent } = tracks;

	// Get feature data
	const {
		requireUpgrade,
		requestsCount: allTimeRequestsCount,
		requestsLimit: freeRequestsLimit,
		usagePeriod,
		currentTier,
		increaseRequestsCount,
		costs,
	} = useAiFeature();
	const planType = usePlanType( currentTier );
	const featuredImageCost = costs?.[ FEATURED_IMAGE_FEATURE_NAME ]?.image;
	const requestsCount =
		planType === PLAN_TYPE_TIERED ? usagePeriod?.requestsCount : allTimeRequestsCount;
	const requestsLimit = planType === PLAN_TYPE_FREE ? freeRequestsLimit : currentTier?.limit;
	const isUnlimited = planType === PLAN_TYPE_UNLIMITED;
	const requestsBalance = requestsLimit - requestsCount;
	const notEnoughRequests = requestsBalance < featuredImageCost;

	const postContent = usePostContent();

	// Handle deprecation and move of toggle action from edit-post.
	// https://github.com/WordPress/gutenberg/blob/fe4d8cb936df52945c01c1863f7b87b58b7cc69f/packages/edit-post/CHANGELOG.md?plain=1#L19
	const toggleEditorPanelOpened =
		toggleEditorPanelOpenedFromEditor ?? toggleEditorPanelOpenedFromEditPost;
	const isEditorPanelOpened = useSelect( select => {
		const isOpened =
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			( select( 'core/editor' ) as any ).isEditorPanelOpened ??
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			( select( 'core/edit-post' ) as any ).isEditorPanelOpened;
		return isOpened;
	}, [] );

	/*
	 * Function to update the requests count after a featured image generation.
	 */
	const updateRequestsCount = useCallback( () => {
		increaseRequestsCount( featuredImageCost );
	}, [ increaseRequestsCount, featuredImageCost ] );

	/*
	 * Function to generate a new image with the current value of the post content.
	 */
	const processImageGeneration = useCallback( () => {
		setGenerating( true );
		setError( null );
		setLibraryImage( null );

		generateImage( {
			feature: FEATURED_IMAGE_FEATURE_NAME,
			postContent,
			responseFormat: 'b64_json',
		} )
			.then( result => {
				if ( result.data.length > 0 ) {
					const image = 'data:image/png;base64,' + result.data[ 0 ].b64_json;
					setImageURL( image );
					updateRequestsCount();
					saveToMediaLibrary( image ).then( savedImage => {
						setLibraryImage( savedImage );
					} );
				}
			} )
			.catch( e => {
				setError( e );
			} )
			.finally( () => {
				setGenerating( false );
			} );
	}, [ generateImage, postContent, updateRequestsCount, saveToMediaLibrary ] );

	const toggleFeaturedImageModal = useCallback( () => {
		setIsFeaturedImageModalVisible( ! isFeaturedImageModalVisible );
	}, [ isFeaturedImageModalVisible, setIsFeaturedImageModalVisible ] );

	const handleGenerate = useCallback( () => {
		// track the generate image event
		recordEvent( 'jetpack_ai_featured_image_generation_generate_image', {
			placement: JETPACK_SIDEBAR_PLACEMENT,
		} );

		toggleFeaturedImageModal();
		processImageGeneration();
	}, [ toggleFeaturedImageModal, processImageGeneration, recordEvent ] );

	const handleRegenerate = useCallback( () => {
		// track the regenerate image event
		recordEvent( 'jetpack_ai_featured_image_generation_generate_another_image', {
			placement: JETPACK_SIDEBAR_PLACEMENT,
		} );

		processImageGeneration();
	}, [ processImageGeneration, recordEvent ] );

	const handleTryAgain = useCallback( () => {
		// track the try again event
		recordEvent( 'jetpack_ai_featured_image_generation_try_again', {
			placement: JETPACK_SIDEBAR_PLACEMENT,
		} );

		processImageGeneration();
	}, [ processImageGeneration, recordEvent ] );

	const triggerComplementaryArea = useCallback( () => {
		enableComplementaryArea( 'core/edit-post', 'edit-post/document' );
	}, [ enableComplementaryArea ] );

	const handleAccept = useCallback( () => {
		// track the accept/use image event
		recordEvent( 'jetpack_ai_featured_image_generation_use_image', {
			placement: JETPACK_SIDEBAR_PLACEMENT,
		} );

		const setAsFeaturedImage = image => {
			editPost( { featured_media: image.id } );
			toggleFeaturedImageModal();

			// Open the featured image panel for users to see the new image.
			setTimeout( () => {
				// If the panel is not opened, open it and then trigger the complementary area.
				if ( ! isEditorPanelOpened( 'featured-image' ) ) {
					toggleEditorPanelOpened?.( 'featured-image' ).then( () => {
						triggerComplementaryArea();
					} );
				} else {
					triggerComplementaryArea();
				}
			}, 500 );
		};

		// If the image is already in the media library, use it directly, if it failed for some reason
		// save it to the media library and then use it.
		if ( libraryImage ) {
			setAsFeaturedImage( libraryImage );
		} else {
			saveToMediaLibrary( imageURL ).then( image => {
				setAsFeaturedImage( image );
			} );
		}
	}, [
		editPost,
		imageURL,
		isEditorPanelOpened,
		libraryImage,
		recordEvent,
		saveToMediaLibrary,
		toggleEditorPanelOpened,
		toggleFeaturedImageModal,
		triggerComplementaryArea,
	] );

	const modalTitle = __( 'Generate a featured image with AI', 'jetpack' );

	return (
		<div>
			<p>{ __( 'Create and use an AI generated featured image for your post.', 'jetpack' ) }</p>
			<Button
				onClick={ handleGenerate }
				isBusy={ busy }
				disabled={ ! postContent || disabled || notEnoughRequests }
				variant="secondary"
			>
				{ __( 'Generate image', 'jetpack' ) }
			</Button>
			{ isFeaturedImageModalVisible && (
				<AiAssistantModal handleClose={ toggleFeaturedImageModal } title={ modalTitle }>
					{ generating ? (
						<div className="ai-assistant-featured-image__loading">
							<Spinner
								style={ {
									width: '50px',
									height: '50px',
								} }
							/>
						</div>
					) : (
						<div className="ai-assistant-featured-image__content">
							<div className="ai-assistant-featured-image__image-canvas">
								{ ( requireUpgrade || notEnoughRequests ) && (
									<UpgradePrompt
										description={
											notEnoughRequests
												? sprintf(
														// Translators: %d is the cost of generating a featured image.
														__(
															"Featured image generation costs %d requests per image. You don't have enough requests to generate another image.",
															'jetpack'
														),
														featuredImageCost
												  )
												: null
										}
									/>
								) }
								{ error ? (
									<div className="ai-assistant-featured-image__error">
										{ __(
											'An error occurred while generating the image. Please, try again!',
											'jetpack'
										) }
										{ error?.message && (
											<span className="ai-assistant-featured-image__error-message">
												{ error?.message }
											</span>
										) }
									</div>
								) : (
									<img className="ai-assistant-featured-image__image" src={ imageURL } alt="" />
								) }
							</div>
							<div className="ai-assistant-featured-image__actions">
								<div className="ai-assistant-featured-image__actions-left">
									{ ! isUnlimited && featuredImageCost && requestsLimit && (
										<UsageCounter
											cost={ featuredImageCost }
											currentLimit={ requestsLimit }
											currentUsage={ requestsCount }
										/>
									) }
								</div>
								<div className="ai-assistant-featured-image__actions-right">
									<div className="ai-assistant-featured-image__action-buttons">
										{ error ? (
											<Button onClick={ handleTryAgain } variant="secondary">
												{ __( 'Try again', 'jetpack' ) }
											</Button>
										) : (
											<Button
												onClick={ handleRegenerate }
												variant="secondary"
												disabled={ isSavingToMediaLibrary || notEnoughRequests }
											>
												{ __( 'Generate again', 'jetpack' ) }
											</Button>
										) }
										{ ! error && (
											<Button
												onClick={ handleAccept }
												variant="primary"
												isBusy={ isSavingToMediaLibrary }
												disabled={ isSavingToMediaLibrary }
											>
												{ __( 'Set as featured image', 'jetpack' ) }
											</Button>
										) }
									</div>
								</div>
							</div>
						</div>
					) }
				</AiAssistantModal>
			) }
		</div>
	);
}
