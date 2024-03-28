/**
 * External dependencies
 */
import { useImageGenerator } from '@automattic/jetpack-ai-client';
import { Button, Spinner } from '@wordpress/components';
import { useDispatch } from '@wordpress/data';
import { store as editorStore } from '@wordpress/editor';
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

export default function FeaturedImage() {
	const { editPost } = useDispatch( editorStore );
	const [ isFeaturedImageModalVisible, setIsFeaturedImageModalVisible ] = useState( false );
	const [ generating, setGenerating ] = useState( false );
	const [ imageURL, setImageURL ] = useState( null );
	const { generateImage } = useImageGenerator();
	const { isLoading: isSavingToMediaLibrary, saveToMediaLibrary } = useSaveToMediaLibrary();

	const postContent = usePostContent();

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
		toggleFeaturedImageModal();
		processImageGeneration();
	}, [ toggleFeaturedImageModal, processImageGeneration ] );

	const handleRegenerate = useCallback( () => {
		processImageGeneration();
	}, [ processImageGeneration ] );

	const handleAccept = useCallback( () => {
		saveToMediaLibrary( imageURL ).then( image => {
			editPost( { featured_media: image.id } );
			toggleFeaturedImageModal();
		} );
	}, [ editPost, imageURL, saveToMediaLibrary, toggleFeaturedImageModal ] );

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
			<Button onClick={ handleGenerate } variant="secondary">
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
