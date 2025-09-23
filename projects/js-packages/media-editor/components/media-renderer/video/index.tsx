/**
 * Internal dependencies
 */
import type { MediaItem } from '../../../types.ts';

/**
 *
 * @param root0
 * @param root0.post
 */
export default function VideoRenderer( { post }: { post: MediaItem } ) {
	if ( ! post ) {
		return null;
	}

	return (
		<video
			className="next-admin-media-editor-content__video"
			controls={ true }
			// poster={ % use the attachment's featured image % }
			preload="true"
			src={ post?.source_url }
		/>
	);
}
