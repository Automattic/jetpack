/**
 * Internal dependencies
 */
import type { MediaItem } from '../../../types.ts';

/**
 *
 * @param root0
 * @param root0.post
 */
export default function AudioRenderer( { post }: { post: MediaItem } ) {
	if ( ! post ) {
		return null;
	}

	return <audio controls={ true } src={ post?.source_url } autoPlay={ false } preload="true" />;
}
