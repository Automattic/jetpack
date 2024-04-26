/**
 * External dependencies
 */
import { useImageGenerator } from '@automattic/jetpack-ai-client';
import { useAnalytics } from '@automattic/jetpack-shared-extension-utils';
import { Button, Tooltip } from '@wordpress/components';
import { useDispatch, useSelect } from '@wordpress/data';
import { useCallback, useRef, useState } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';
import { Icon, external } from '@wordpress/icons';
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
import Carrousel, { CarrouselImageData, CarrouselImages } from './carrousel';
import UsageCounter from './usage-counter';

const FEATURED_IMAGE_FEATURE_NAME = 'featured-post-image';
const JETPACK_SIDEBAR_PLACEMENT = 'jetpack-sidebar';

export default function FeaturedImage( { busy, disabled }: { busy: boolean; disabled: boolean } ) {
	const { toggleEditorPanelOpened: toggleEditorPanelOpenedFromEditPost } =
		useDispatch( 'core/edit-post' );
	const { editPost, toggleEditorPanelOpened: toggleEditorPanelOpenedFromEditor } =
		useDispatch( 'core/editor' );
	const { clearSelectedBlock } = useDispatch( 'core/block-editor' );

	const [ isFeaturedImageModalVisible, setIsFeaturedImageModalVisible ] = useState( false );
	const [ images, setImages ] = useState< CarrouselImages >( [ { generating: true } ] );
	const [ current, setCurrent ] = useState( 0 );
	const pointer = useRef( 0 );

	const { enableComplementaryArea } = useDispatch( 'core/interface' );
	const { generateImage } = useImageGenerator();
	const { saveToMediaLibrary } = useSaveToMediaLibrary();
	const { tracks } = useAnalytics();
	const { recordEvent } = tracks;

	const currentImage = images[ current ];
	const currentPointer = images[ pointer.current ];

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

	/* Merge the image data with the new data. */
	const updateImages = useCallback( ( data: CarrouselImageData, index ) => {
		setImages( currentImages => {
			const newImages = [ ...currentImages ];
			newImages[ index ] = {
				...newImages[ index ],
				...data,
			};
			return newImages;
		} );
	}, [] );

	const handlePreviousImage = useCallback( () => {
		setCurrent( Math.max( current - 1, 0 ) );
	}, [ current, setCurrent ] );

	const handleNextImage = useCallback( () => {
		setCurrent( Math.min( current + 1, images.length - 1 ) );
	}, [ current, images.length ] );

	/*
	 * Function to generate a new image with the current value of the post content.
	 */
	const processImageGeneration = useCallback( () => {
		updateImages( { generating: true, error: null }, pointer.current );

		generateImage( {
			feature: FEATURED_IMAGE_FEATURE_NAME,
			postContent,
			responseFormat: 'b64_json',
		} )
			.then( result => {
				if ( result.data.length > 0 ) {
					const image = 'data:image/png;base64,' + result.data[ 0 ].b64_json;
					updateImages( { image }, pointer.current );
					updateRequestsCount();
					saveToMediaLibrary( image )
						.then( savedImage => {
							updateImages( { libraryId: savedImage.id, generating: false }, pointer.current );
							pointer.current += 1;
						} )
						.catch( () => {
							updateImages( { generating: false }, pointer.current );
							pointer.current += 1;
						} );
				}
			} )
			.catch( e => {
				updateImages( { generating: false, error: e }, pointer.current );
			} );
	}, [ updateImages, generateImage, postContent, updateRequestsCount, saveToMediaLibrary ] );

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
		setCurrent( crrt => crrt + 1 );
	}, [ processImageGeneration, recordEvent ] );

	const handleTryAgain = useCallback( () => {
		// track the try again event
		recordEvent( 'jetpack_ai_featured_image_generation_try_again', {
			placement: JETPACK_SIDEBAR_PLACEMENT,
		} );

		processImageGeneration();
	}, [ processImageGeneration, recordEvent ] );

	const triggerComplementaryArea = useCallback( () => {
		// clear any block selection, because selected blocks have precedence on settings sidebar
		clearSelectedBlock();
		return enableComplementaryArea( 'core/edit-post', 'edit-post/document' );
	}, [ clearSelectedBlock, enableComplementaryArea ] );

	const handleAccept = useCallback( () => {
		// track the accept/use image event
		recordEvent( 'jetpack_ai_featured_image_generation_use_image', {
			placement: JETPACK_SIDEBAR_PLACEMENT,
		} );

		const setAsFeaturedImage = image => {
			editPost( { featured_media: image } );
			toggleFeaturedImageModal();

			// Open the featured image panel for users to see the new image.
			setTimeout( () => {
				const isFeaturedImagePanelOpened = isEditorPanelOpened( 'featured-image' );
				const isPostStatusPanelOpened = isEditorPanelOpened( 'post-status' );

				// open the complementary area and then trigger the featured image panel.
				triggerComplementaryArea().then( () => {
					if ( ! isFeaturedImagePanelOpened ) {
						toggleEditorPanelOpened( 'featured-image' );
					}
					// handle the case where the featured image panel is not present
					if ( ! isPostStatusPanelOpened ) {
						toggleEditorPanelOpened( 'post-status' );
					}
				} );
			}, 500 );
		};

		// If the image is already in the media library, use it directly, if it failed for some reason
		// save it to the media library and then use it.
		if ( images[ current ].libraryId ) {
			setAsFeaturedImage( images[ current ].libraryId );
		} else {
			saveToMediaLibrary( images[ current ].image ).then( image => {
				setAsFeaturedImage( image.id );
			} );
		}
	}, [
		current,
		editPost,
		images,
		isEditorPanelOpened,
		recordEvent,
		saveToMediaLibrary,
		toggleEditorPanelOpened,
		toggleFeaturedImageModal,
		triggerComplementaryArea,
	] );

	const modalTitle = __( 'Generate a featured image with AI', 'jetpack' );
	const costTooltipText = sprintf(
		// Translators: %d is the cost of generating one image.
		__( '%d requests per image', 'jetpack' ),
		featuredImageCost
	);

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
					<div className="ai-assistant-featured-image__content">
						<div className="ai-assistant-featured-image__image-canvas">
							{ ( requireUpgrade || notEnoughRequests ) && ! currentPointer?.generating && (
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
							<Carrousel
								images={ images }
								current={ current }
								handlePreviousImage={ handlePreviousImage }
								handleNextImage={ handleNextImage }
							/>
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
									{ currentPointer?.error ? (
										<Button onClick={ handleTryAgain } variant="secondary">
											{ __( 'Try again', 'jetpack' ) }
										</Button>
									) : (
										<Tooltip text={ costTooltipText } placement="bottom">
											<Button
												onClick={ handleRegenerate }
												variant="secondary"
												isBusy={ currentPointer?.generating }
												disabled={ notEnoughRequests || currentPointer?.generating }
											>
												{ __( 'Generate again', 'jetpack' ) }
											</Button>
										</Tooltip>
									) }
									<Button
										onClick={ handleAccept }
										variant="primary"
										isBusy={ currentImage?.generating }
										disabled={ ! currentImage?.image }
									>
										{ __( 'Set as featured image', 'jetpack' ) }
									</Button>
								</div>
							</div>
						</div>
					</div>
					<div className="ai-assistant-featured-image__footer">
						<Button
							variant="link"
							className="ai-assistant-featured-image__feedback-button"
							href="https://jetpack.com/redirect/?source=jetpack-ai-feedback"
							target="_blank"
						>
							<span>{ __( 'Provide feedback', 'jetpack' ) }</span>
							<Icon icon={ external } className="icon" />
						</Button>
					</div>
				</AiAssistantModal>
			) }
		</div>
	);
}
