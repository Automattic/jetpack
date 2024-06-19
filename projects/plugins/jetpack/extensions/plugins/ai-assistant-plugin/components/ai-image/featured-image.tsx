/**
 * External dependencies
 */
import {
	useAnalytics,
	isAtomicSite,
	isSimpleSite,
} from '@automattic/jetpack-shared-extension-utils';
import { Button, Tooltip } from '@wordpress/components';
import { useDispatch, useSelect } from '@wordpress/data';
import { useCallback, useRef, useState, useEffect } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';
import { Icon, external } from '@wordpress/icons';
/**
 * Internal dependencies
 */
import './style.scss';
import UpgradePrompt from '../../../../blocks/ai-assistant/components/upgrade-prompt';
import useAiFeature from '../../../../blocks/ai-assistant/hooks/use-ai-feature';
import { PLAN_TYPE_UNLIMITED, usePlanType } from '../../../../shared/use-plan-type';
import usePostContent from '../../hooks/use-post-content';
import useSaveToMediaLibrary from '../../hooks/use-save-to-media-library';
import {
	PLACEMENT_JETPACK_SIDEBAR,
	PLACEMENT_DOCUMENT_SETTINGS,
} from '../ai-assistant-plugin-sidebar/types';
import AiAssistantModal from '../modal';
import Carrousel from './carrousel';
import useAiImage from './hooks/use-ai-image';
import { FEATURED_IMAGE_FEATURE_NAME } from './types';
import UsageCounter from './usage-counter';

const FEATURED_IMAGE_UPGRADE_PROMPT_PLACEMENT = 'ai-image-generator';
export const FEATURED_IMAGE_PLACEMENT_MEDIA_SOURCE_DROPDOWN = 'media-source-dropdown';

const IMAGE_GENERATION_MODEL_STABLE_DIFFUSION = 'stable-diffusion';
const IMAGE_GENERATION_MODEL_DALL_E_3 = 'dall-e-3';
/**
 * Determine the site type for tracking purposes.
 *
 * @returns {string} The site type, one of atomic, simple, jetpack.
 */
const getSiteType = () => {
	if ( isAtomicSite() ) {
		return 'atomic';
	}
	if ( isSimpleSite() ) {
		return 'simple';
	}
	return 'jetpack';
};
const SITE_TYPE = getSiteType();

export default function FeaturedImage( {
	busy,
	disabled,
	placement,
	onClose = () => {},
}: {
	busy: boolean;
	disabled: boolean;
	placement: string;
	onClose?: () => void;
} ) {
	const { toggleEditorPanelOpened: toggleEditorPanelOpenedFromEditPost } =
		useDispatch( 'core/edit-post' );
	const { editPost, toggleEditorPanelOpened: toggleEditorPanelOpenedFromEditor } =
		useDispatch( 'core/editor' );
	const { clearSelectedBlock } = useDispatch( 'core/block-editor' );

	const [ isFeaturedImageModalVisible, setIsFeaturedImageModalVisible ] = useState( false );
<<<<<<< HEAD
	const [ current, setCurrent ] = useState( 0 );
=======
	// const [ images, setImages ] = useState< CarrouselImages >( [ { generating: true } ] );
	const [ current, setCurrent ] = useState( 0 );
	// const pointer = useRef( 0 );
>>>>>>> 6e8b359e7d (AI Image: Extract AI Image usage to hook)
	const [ userPrompt, setUserPrompt ] = useState( '' );
	const triggeredAutoGeneration = useRef( false );

	const { enableComplementaryArea } = useDispatch( 'core/interface' );
	const { saveToMediaLibrary } = useSaveToMediaLibrary();
	const { tracks } = useAnalytics();
	const { recordEvent } = tracks;

<<<<<<< HEAD
=======
	// const currentImage = images[ current ];
	// const currentPointer = images[ pointer.current ];

>>>>>>> 6e8b359e7d (AI Image: Extract AI Image usage to hook)
	// Get feature data
	const { requireUpgrade, requestsCount, requestsLimit, currentTier, costs } = useAiFeature();
	const planType = usePlanType( currentTier );
	const featuredImageCost = costs?.[ FEATURED_IMAGE_FEATURE_NAME ]?.activeModel ?? 10;
	const featuredImageActiveModel =
		featuredImageCost === costs?.[ FEATURED_IMAGE_FEATURE_NAME ]?.stableDiffusion
			? IMAGE_GENERATION_MODEL_STABLE_DIFFUSION
			: IMAGE_GENERATION_MODEL_DALL_E_3;
	const isUnlimited = planType === PLAN_TYPE_UNLIMITED;
	const requestsBalance = requestsLimit - requestsCount;
	const notEnoughRequests = requestsBalance < featuredImageCost;

	const postContent = usePostContent();

	const {
		processImageGeneration,
		handlePreviousImage,
		handleNextImage,
		currentImage,
		currentPointer,
		images,
	} = useAiImage( { cost: featuredImageCost } );

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

	const toggleFeaturedImageModal = useCallback( () => {
		setIsFeaturedImageModalVisible( ! isFeaturedImageModalVisible );
	}, [ isFeaturedImageModalVisible, setIsFeaturedImageModalVisible ] );

	const handleModalClose = useCallback( () => {
		toggleFeaturedImageModal();
		onClose?.();
	}, [ toggleFeaturedImageModal, onClose ] );

	const handleGenerate = useCallback( () => {
		// track the generate image event
		recordEvent( 'jetpack_ai_featured_image_generation_generate_image', {
			placement,
			model: featuredImageActiveModel,
			site_type: SITE_TYPE,
		} );

		toggleFeaturedImageModal();
		processImageGeneration( { userPrompt, postContent, notEnoughRequests } ).catch( error => {
			recordEvent( 'jetpack_ai_featured_image_generation_error', {
				placement,
				error: error?.message,
				model: featuredImageActiveModel,
				site_type: SITE_TYPE,
			} );
		} );
	}, [
		recordEvent,
		placement,
		featuredImageActiveModel,
		toggleFeaturedImageModal,
		processImageGeneration,
		userPrompt,
		postContent,
		notEnoughRequests,
	] );

	const handleRegenerate = useCallback( () => {
		// track the regenerate image event
		recordEvent( 'jetpack_ai_featured_image_generation_generate_another_image', {
			placement,
			model: featuredImageActiveModel,
			site_type: SITE_TYPE,
		} );

		processImageGeneration( { userPrompt, postContent, notEnoughRequests } )
			.then( () => {
				setCurrent( crrt => crrt + 1 );
			} )
			.catch( error => {
				recordEvent( 'jetpack_ai_featured_image_generation_error', {
					placement,
					error: error?.message,
					model: featuredImageActiveModel,
					site_type: SITE_TYPE,
				} );
			} );
	}, [
		recordEvent,
		placement,
		featuredImageActiveModel,
		processImageGeneration,
		userPrompt,
		postContent,
		notEnoughRequests,
	] );

	const handleTryAgain = useCallback( () => {
		// track the try again event
		recordEvent( 'jetpack_ai_featured_image_generation_try_again', {
			placement,
			model: featuredImageActiveModel,
			site_type: SITE_TYPE,
		} );

		processImageGeneration( { userPrompt, postContent, notEnoughRequests } ).catch( error => {
			recordEvent( 'jetpack_ai_featured_image_generation_error', {
				placement,
				error: error?.message,
				model: featuredImageActiveModel,
				site_type: SITE_TYPE,
			} );
		} );
	}, [
		recordEvent,
		placement,
		featuredImageActiveModel,
		processImageGeneration,
		userPrompt,
		postContent,
		notEnoughRequests,
	] );

	const handleUserPromptChange = useCallback(
		( e: React.ChangeEvent< HTMLTextAreaElement > ) => {
			setUserPrompt( e.target.value );
		},
		[ setUserPrompt ]
	);

	const triggerComplementaryArea = useCallback( () => {
		// clear any block selection, because selected blocks have precedence on settings sidebar
		clearSelectedBlock();
		return enableComplementaryArea( 'core/edit-post', 'edit-post/document' );
	}, [ clearSelectedBlock, enableComplementaryArea ] );

	const handleAccept = useCallback( () => {
		// track the accept/use image event
		recordEvent( 'jetpack_ai_featured_image_generation_use_image', {
			placement,
			model: featuredImageActiveModel,
			site_type: SITE_TYPE,
		} );

		const setAsFeaturedImage = image => {
			editPost( { featured_media: image } );
			handleModalClose();

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
		if ( currentImage.libraryId ) {
			setAsFeaturedImage( currentImage.libraryId );
		} else {
			saveToMediaLibrary( currentImage.image )
				.then( image => {
					setAsFeaturedImage( image.id );
				} )
				.catch( error => {
					recordEvent( 'jetpack_ai_featured_image_saving_error', {
						placement,
						error: error?.message,
						model: featuredImageActiveModel,
						site_type: SITE_TYPE,
					} );
				} );
		}
	}, [
		recordEvent,
		placement,
		featuredImageActiveModel,
		currentImage.libraryId,
		currentImage.image,
		editPost,
		handleModalClose,
		isEditorPanelOpened,
		triggerComplementaryArea,
		toggleEditorPanelOpened,
		saveToMediaLibrary,
	] );

	/**
	 * When the placement is set to FEATURED_IMAGE_PLACEMENT_MEDIA_SOURCE_DROPDOWN, we generate the image automatically.
	 */
	useEffect( () => {
		if ( placement === FEATURED_IMAGE_PLACEMENT_MEDIA_SOURCE_DROPDOWN ) {
			if ( ! triggeredAutoGeneration.current ) {
				triggeredAutoGeneration.current = true;
				handleGenerate();
			}
		}
	}, [ placement, handleGenerate ] );

	const modalTitle = __( 'Generate a featured image with AI', 'jetpack' );

	const costTooltipTextSingular = __( '1 request per image', 'jetpack' );

	const costTooltipTextPlural = sprintf(
		// Translators: %d is the cost of generating one image.
		__( '%d requests per image', 'jetpack' ),
		featuredImageCost
	);

	const costTooltipText = featuredImageCost === 1 ? costTooltipTextSingular : costTooltipTextPlural;

	const acceptButton = (
		<Button
			onClick={ handleAccept }
			variant="primary"
			isBusy={ currentImage?.generating }
			disabled={ ! currentImage?.image }
		>
			{ __( 'Set as featured image', 'jetpack' ) }
		</Button>
	);

	return (
		<div>
			{ ( placement === PLACEMENT_JETPACK_SIDEBAR ||
				placement === PLACEMENT_DOCUMENT_SETTINGS ) && (
				<>
					<p>{ __( 'Create and use an AI generated featured image for your post.', 'jetpack' ) }</p>
					<Button
						onClick={ handleGenerate }
						isBusy={ busy }
						disabled={ ! postContent || disabled || notEnoughRequests }
						variant="secondary"
					>
						{ __( 'Generate image', 'jetpack' ) }
					</Button>
				</>
			) }
			{ isFeaturedImageModalVisible && (
				<AiAssistantModal handleClose={ handleModalClose } title={ modalTitle }>
					<div className="ai-assistant-featured-image__content">
						<div className="ai-assistant-featured-image__user-prompt">
							<div className="ai-assistant-featured-image__user-prompt-textarea">
								<textarea
									disabled={ notEnoughRequests || currentPointer?.generating }
									maxLength={ 1000 }
									rows={ 2 }
									onChange={ handleUserPromptChange }
									placeholder={ __(
										'Include optional instructions to generate a new image',
										'jetpack'
									) }
								></textarea>
							</div>
						</div>
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
								placement={ FEATURED_IMAGE_UPGRADE_PROMPT_PLACEMENT }
								useLightNudge={ true }
							/>
						) }
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
										<Button
											onClick={ handleTryAgain }
											variant="secondary"
											disabled={ ! userPrompt && ! postContent }
										>
											{ __( 'Try again', 'jetpack' ) }
										</Button>
									) : (
										<Tooltip text={ costTooltipText } placement="bottom">
											<Button
												onClick={ handleRegenerate }
												variant="secondary"
												isBusy={ currentPointer?.generating }
												disabled={
													notEnoughRequests ||
													currentPointer?.generating ||
													( ! userPrompt && ! postContent )
												}
											>
												{ __( 'Generate again', 'jetpack' ) }
											</Button>
										</Tooltip>
									) }
								</div>
							</div>
						</div>
						<div className="ai-assistant-featured-image__image-canvas">
							<Carrousel
								images={ images }
								current={ current }
								handlePreviousImage={ handlePreviousImage }
								handleNextImage={ handleNextImage }
								actions={ acceptButton }
							/>
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
