/**
 * WordPress dependencies
 */

import { useMemo } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { getMediaTypeFromMimeType } from '../../utils.ts';
import ApplicationRenderer from './application/index.tsx';
import AudioRenderer from './audio/index.tsx';
import ImageRenderer from './image/index.tsx';
import VideoRenderer from './video/index.tsx';
import type { MediaItem } from '../../types.ts';

import './style.scss';

const MEDIA_RENDERERS = {
	application: ApplicationRenderer,
	audio: AudioRenderer,
	image: ImageRenderer,
	video: VideoRenderer,
};

/*
 * The media renderer component renders the media based on the media type.
 */
/**
 *
 * @param root0
 * @param root0.post
 */
export default function MediaRenderer( { post }: { post: MediaItem } ) {
	const mediaType = useMemo(
		() => getMediaTypeFromMimeType( post.mime_type || '' ),
		[ post.mime_type ]
	);
	const RendererComponent = MEDIA_RENDERERS[ mediaType.type ];

	if ( ! RendererComponent ) {
		return null;
	}

	return <RendererComponent post={ post } />;
}
