/**
 * Internal dependencies
 */
import { useMediaEditorState } from '../../../provider/with-media-editor-state-provider.tsx';
import ImageCropper from './editing-tools/image-cropper.tsx';
import ImagePreview from './preview.tsx';
import type { MediaItem } from '../../../types.ts';

/**
 *
 * @param root0
 * @param root0.post
 */
export default function ImageRenderer( { post }: { post: MediaItem } ) {
	const { isImageEditorOpen, isEditInProgress } = useMediaEditorState();

	if ( ! post || isEditInProgress ) {
		return null; // Or a loading spinner/placeholder.
	}

	return isImageEditorOpen ? (
		<ImageCropper src={ post.source_url } />
	) : (
		<ImagePreview sourceUrl={ post.source_url } altText={ post.alt_text } />
	);
}
