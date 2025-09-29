/**
 * Internal dependencies
 */
import type { MediaItem } from '../../../types';

export default function AudioRenderer( { post }: { post: MediaItem } ) {
	if ( ! post ) {
		return null;
	}

	return <audio controls={ true } src={ post?.source_url } autoPlay={ false } preload="true" />;
}
