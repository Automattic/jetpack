/**
 * WordPress dependencies
 */
// TODO: Re-enable when @wordpress/image-cropper is available
// import { useImageCropper } from '@wordpress/image-cropper';
import { useEffect, useState } from '@wordpress/element';

// Temporary stub until @wordpress/image-cropper is available
const useImageCropper = () => ( {
	getCroppedImage: ( sourceUrl: string ) => Promise.resolve( '' ),
	isDirty: false,
} );

/**
 * Internal dependencies
 */
import { useMediaEditorState } from '../../provider/with-media-editor-state-provider';
import './ai-styles.scss';

export default function ImagePreview( {
	sourceUrl,
	altText,
}: {
	sourceUrl: string;
	altText: string;
} ) {
	const { getCroppedImage, isDirty: isImageDirty } = useImageCropper();
	const { aiEditedImageUrl, isAiProcessing } = useMediaEditorState();
	const [ displayUrl, setDisplayUrl ] = useState< string | null >( null );
	const [ isLoading, setIsLoading ] = useState( false );

	useEffect( () => {
		// Priority order: AI-edited image > cropped image > original image
		if ( aiEditedImageUrl ) {
			// Show AI-edited version
			setDisplayUrl( aiEditedImageUrl );
			setIsLoading( false );
		} else if ( isImageDirty ) {
			// Show cropped version
			setIsLoading( true );
			setDisplayUrl( null ); // Clear the display URL to prevent showing original.

			getCroppedImage( sourceUrl ).then( croppedImage => {
				if ( croppedImage ) {
					setDisplayUrl( croppedImage );
				}
				setIsLoading( false );
			} );
		} else {
			// Show original image
			setDisplayUrl( sourceUrl );
			setIsLoading( false );
		}
	}, [ isImageDirty, sourceUrl, getCroppedImage, aiEditedImageUrl ] );

	// Don't render the image if we're loading a cropped version or AI is processing
	if ( isLoading || ( isImageDirty && ! displayUrl ) ) {
		return null; // Or a loading spinner/placeholder.
	}

	// Show AI processing indicator
	if ( isAiProcessing ) {
		return (
			<div className="next-admin-media-editor-content__ai-processing">
				<img
					className="next-admin-media-editor-content__image next-admin-media-editor-content__image--processing"
					src={ displayUrl || sourceUrl }
					alt={ altText }
					style={ { opacity: 0.6 } }
				/>
				<div className="next-admin-media-editor-content__ai-overlay">
					<div className="next-admin-media-editor-content__ai-spinner">
						<span>AI is editing your image...</span>
					</div>
				</div>
			</div>
		);
	}

	return (
		<div className="next-admin-media-editor-content__image-container">
			<img
				className={ `next-admin-media-editor-content__image ${
					aiEditedImageUrl ? 'next-admin-media-editor-content__image--ai-edited' : ''
				}` }
				src={ displayUrl || sourceUrl }
				alt={ altText }
			/>
			{ aiEditedImageUrl && (
				<div className="next-admin-media-editor-content__ai-badge">
					<span>✨ AI Edited</span>
				</div>
			) }
		</div>
	);
}
