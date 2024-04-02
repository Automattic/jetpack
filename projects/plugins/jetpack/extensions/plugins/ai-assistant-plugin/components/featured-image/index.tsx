/**
 * External dependencies
 */
import { useImageGenerator } from '@automattic/jetpack-ai-client';
import { useAnalytics } from '@automattic/jetpack-shared-extension-utils';
import { Button, Spinner } from '@wordpress/components';
import { useDispatch, useSelect } from '@wordpress/data';
import { useCallback, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
/**
 * Internal dependencies
 */
import './style.scss';
import usePostContent from '../../hooks/use-post-content';
import useSaveToMediaLibrary from '../../hooks/use-save-to-media-library';
import AiAssistantModal from '../modal';

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
	const { generateImage } = useImageGenerator();
	const { isLoading: isSavingToMediaLibrary, saveToMediaLibrary } = useSaveToMediaLibrary();
	const { tracks } = useAnalytics();
	const { recordEvent } = tracks;

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
	 * Function to generate a new image with the current value of the post content.
	 */
	const processImageGeneration = useCallback( () => {
		setGenerating( true );
		generateImage( {
			feature: FEATURED_IMAGE_FEATURE_NAME,
			postContent,
			responseFormat: 'b64_json',
		} )
			.then( result => {
				if ( result.data.length > 0 ) {
					const image = 'data:image/png;base64,' + result.data[ 0 ].b64_json;
					setImageURL( image );
				}
			} )
			.catch( error => {
				// eslint-disable-next-line no-console
				console.error( error );
			} )
			.finally( () => {
				setGenerating( false );
			} );
	}, [ postContent, setGenerating, setImageURL, generateImage ] );

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

	const triggerComplementaryArea = useCallback( () => {
		enableComplementaryArea( 'core/edit-post', 'edit-post/document' );
	}, [ enableComplementaryArea ] );

	const handleAccept = useCallback( () => {
		// track the accept/use image event
		recordEvent( 'jetpack_ai_featured_image_generation_use_image', {
			placement: JETPACK_SIDEBAR_PLACEMENT,
		} );

		saveToMediaLibrary( imageURL ).then( image => {
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
		} );
	}, [
		editPost,
		imageURL,
		isEditorPanelOpened,
		recordEvent,
		saveToMediaLibrary,
		toggleEditorPanelOpened,
		toggleFeaturedImageModal,
		triggerComplementaryArea,
	] );

	const modalTitleWhenGenerating = __( 'Generating featured image…', 'jetpack' );
	const modalTitleWhenDone = __( 'Featured Image Generation', 'jetpack' );

	return (
		<div>
			<p>
				{ __(
					'Ask Jetpack AI to generate an image based on your post content, to use as the post featured image.',
					'jetpack'
				) }
			</p>
			<Button
				onClick={ handleGenerate }
				isBusy={ busy }
				disabled={ ! postContent || disabled }
				variant="secondary"
			>
				{ __( 'Generate image', 'jetpack' ) }
			</Button>
			{ isFeaturedImageModalVisible && (
				<AiAssistantModal
					handleClose={ toggleFeaturedImageModal }
					title={ generating ? modalTitleWhenGenerating : modalTitleWhenDone }
				>
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
							<img className="ai-assistant-featured-image__image" src={ imageURL } alt="" />
							<div className="ai-assistant-featured-image__actions">
								<Button
									onClick={ handleAccept }
									variant="secondary"
									isBusy={ isSavingToMediaLibrary }
									disabled={ isSavingToMediaLibrary }
								>
									{ __( 'Save and use image', 'jetpack' ) }
								</Button>
								<Button
									onClick={ handleRegenerate }
									variant="secondary"
									disabled={ isSavingToMediaLibrary }
								>
									{ __( 'Generate another image', 'jetpack' ) }
								</Button>
							</div>
						</div>
					) }
				</AiAssistantModal>
			) }
		</div>
	);
}
