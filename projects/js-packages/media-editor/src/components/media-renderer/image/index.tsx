/**
 * Internal dependencies
 */
import type { MediaItem } from '../../../types';
import ImageCropper from './editing-tools/image-cropper';
import { useMediaEditorState } from '../../provider/with-media-editor-state-provider';
import ImagePreview from './preview';

export default function ImageRenderer( { post }: { post: MediaItem } ) {
	const { isImageEditorOpen, isEditInProgress } = useMediaEditorState();
	console.log( 'ImageRenderer render', {
		post,
		isImageEditorOpen,
		isEditInProgress,
	} );
	if ( ! post || isEditInProgress ) {
		return null; // Or a loading spinner/placeholder.
	}

	return isImageEditorOpen ? (
		<ImageCropper src={ post.source_url } />
	) : (
		<ImagePreview sourceUrl={ post.source_url } altText={ post.alt_text } />
	);
}
