/**
 * External dependencies
 */
import { useAnalytics } from '@automattic/jetpack-shared-extension-utils';
import { Button } from '@wordpress/components';
import { useDispatch, useSelect } from '@wordpress/data';
import { useCallback, useState } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';
/**
 * Internal dependencies
 */
import './style.scss';
import useAiFeature from '../../../../blocks/ai-assistant/hooks/use-ai-feature';
import { PLAN_TYPE_UNLIMITED, usePlanType } from '../../../../shared/use-plan-type';
import usePostContent from '../../hooks/use-post-content';
import useSaveToMediaLibrary from '../../hooks/use-save-to-media-library';
import {
	PLACEMENT_JETPACK_SIDEBAR,
	PLACEMENT_DOCUMENT_SETTINGS,
} from '../ai-assistant-plugin-sidebar/constants';
import AiImageModal from './components/ai-image-modal';
import useAiImage from './hooks/use-ai-image';
import useSiteType from './hooks/use-site-type';
import {
	FEATURED_IMAGE_FEATURE_NAME,
	IMAGE_GENERATION_MODEL_STABLE_DIFFUSION,
	IMAGE_GENERATION_MODEL_DALL_E_3,
	PLACEMENT_MEDIA_SOURCE_DROPDOWN,
} from './types';

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
	const [ isFeaturedImageModalVisible, setIsFeaturedImageModalVisible ] = useState(
		placement === PLACEMENT_MEDIA_SOURCE_DROPDOWN
	);
	const siteType = useSiteType();
	const postContent = usePostContent();
	const { saveToMediaLibrary } = useSaveToMediaLibrary();
	const { tracks } = useAnalytics();
	const { recordEvent } = tracks;

	// Editor actions
	const { enableComplementaryArea } = useDispatch( 'core/interface' );
	const { clearSelectedBlock } = useDispatch( 'core/block-editor' );
	const { toggleEditorPanelOpened: toggleEditorPanelOpenedFromEditPost } =
		useDispatch( 'core/edit-post' );
	const { editPost, toggleEditorPanelOpened: toggleEditorPanelOpenedFromEditor } =
		useDispatch( 'core/editor' );

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

	const {
		pointer,
		current,
		setCurrent,
		processImageGeneration,
		handlePreviousImage,
		handleNextImage,
		currentImage,
		currentPointer,
		images,
	} = useAiImage( {
		autoStart: false,
		cost: featuredImageCost,
		type: 'featured-image-generation',
		feature: FEATURED_IMAGE_FEATURE_NAME,
	} );

	const handleModalClose = useCallback( () => {
		setIsFeaturedImageModalVisible( false );
		onClose?.();
	}, [ onClose ] );

	const handleModalOpen = useCallback( () => {
		setIsFeaturedImageModalVisible( true );
	}, [] );

	const handleGenerate = useCallback(
		( { userPrompt }: { userPrompt?: string } ) => {
			// track the generate image event
			recordEvent( 'jetpack_ai_featured_image_generation_generate_image', {
				placement,
				model: featuredImageActiveModel,
				site_type: siteType,
			} );

			setIsFeaturedImageModalVisible( true );
			processImageGeneration( { userPrompt, postContent, notEnoughRequests } ).catch( error => {
				recordEvent( 'jetpack_ai_featured_image_generation_error', {
					placement,
					error: error?.message,
					model: featuredImageActiveModel,
					site_type: siteType,
				} );
			} );
		},
		[
			recordEvent,
			placement,
			featuredImageActiveModel,
			siteType,
			processImageGeneration,
			postContent,
			notEnoughRequests,
		]
	);

	const handleRegenerate = useCallback(
		( { userPrompt }: { userPrompt?: string } ) => {
			// track the regenerate image event
			recordEvent( 'jetpack_ai_featured_image_generation_generate_another_image', {
				placement,
				model: featuredImageActiveModel,
				site_type: siteType,
			} );

			setCurrent( crrt => crrt + 1 );
			processImageGeneration( { userPrompt, postContent, notEnoughRequests } ).catch( error => {
				recordEvent( 'jetpack_ai_featured_image_generation_error', {
					placement,
					error: error?.message,
					model: featuredImageActiveModel,
					site_type: siteType,
				} );
			} );
		},
		[
			recordEvent,
			placement,
			featuredImageActiveModel,
			siteType,
			processImageGeneration,
			postContent,
			notEnoughRequests,
			setCurrent,
		]
	);

	const handleTryAgain = useCallback(
		( { userPrompt }: { userPrompt?: string } ) => {
			// track the try again event
			recordEvent( 'jetpack_ai_featured_image_generation_try_again', {
				placement,
				model: featuredImageActiveModel,
				site_type: siteType,
			} );

			processImageGeneration( { userPrompt, postContent, notEnoughRequests } ).catch( error => {
				recordEvent( 'jetpack_ai_featured_image_generation_error', {
					placement,
					error: error?.message,
					model: featuredImageActiveModel,
					site_type: siteType,
				} );
			} );
		},
		[
			recordEvent,
			placement,
			featuredImageActiveModel,
			siteType,
			processImageGeneration,
			postContent,
			notEnoughRequests,
		]
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
			site_type: siteType,
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
		if ( currentImage?.libraryId ) {
			setAsFeaturedImage( currentImage?.libraryId );
		} else {
			saveToMediaLibrary( currentImage?.image )
				.then( image => {
					setAsFeaturedImage( image?.id );
				} )
				.catch( error => {
					recordEvent( 'jetpack_ai_featured_image_saving_error', {
						placement,
						error: error?.message,
						model: featuredImageActiveModel,
						site_type: siteType,
					} );
				} );
		}
	}, [
		recordEvent,
		placement,
		featuredImageActiveModel,
		siteType,
		currentImage?.libraryId,
		currentImage?.image,
		editPost,
		handleModalClose,
		isEditorPanelOpened,
		triggerComplementaryArea,
		toggleEditorPanelOpened,
		saveToMediaLibrary,
	] );

	const generateAgainText = __( 'Generate another image', 'jetpack' );
	const generateText = __( 'Generate', 'jetpack' );

	const upgradeDescription = notEnoughRequests
		? sprintf(
				// Translators: %d is the cost of generating a featured image.
				__(
					"Featured image generation costs %d requests per image. You don't have enough requests to generate another image.",
					'jetpack'
				),
				featuredImageCost
		  )
		: null;

	const acceptButton = (
		<Button
			onClick={ handleAccept }
			variant="primary"
			disabled={ ! currentImage?.image || currentImage?.generating }
		>
			{ __( 'Set as featured image', 'jetpack' ) }
		</Button>
	);

	return (
		<>
			{ ( placement === PLACEMENT_JETPACK_SIDEBAR ||
				placement === PLACEMENT_DOCUMENT_SETTINGS ) && (
				<>
					<p>{ __( 'Create and use an AI generated featured image for your post.', 'jetpack' ) }</p>
					<Button
						onClick={ handleModalOpen }
						isBusy={ busy }
						disabled={ disabled || notEnoughRequests }
						variant="secondary"
					>
						{ __( 'Generate image', 'jetpack' ) }
					</Button>
				</>
			) }
			<AiImageModal
				postContent={ postContent }
				autoStart={ postContent !== '' }
				autoStartAction={ handleGenerate }
				images={ images }
				currentIndex={ current }
				title={ __( 'Generate a featured image with AI', 'jetpack' ) }
				cost={ featuredImageCost }
				open={ isFeaturedImageModalVisible }
				placement={ placement }
				onClose={ handleModalClose }
				onTryAgain={ handleTryAgain }
				onGenerate={ pointer?.current > 0 ? handleRegenerate : handleGenerate }
				generating={ currentPointer?.generating }
				notEnoughRequests={ notEnoughRequests }
				requireUpgrade={ requireUpgrade }
				upgradeDescription={ upgradeDescription }
				currentLimit={ requestsLimit }
				currentUsage={ requestsCount }
				isUnlimited={ isUnlimited }
				hasError={ Boolean( currentPointer?.error ) }
				handlePreviousImage={ handlePreviousImage }
				handleNextImage={ handleNextImage }
				acceptButton={ acceptButton }
				generateButtonLabel={ pointer?.current > 0 ? generateAgainText : generateText }
				instructionsPlaceholder={ __(
					"Describe the image you'd like to create, or have the prompt written for you if you've added content to your post.",
					'jetpack'
				) }
			/>
		</>
	);
}
