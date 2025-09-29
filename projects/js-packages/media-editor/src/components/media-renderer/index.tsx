/**
 * WordPress dependencies
 */

import { useMemo } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { getMediaTypeFromMimeType } from '../../utils';
import type { MediaItem } from '../../types';
import ApplicationRenderer from './application';
import AudioRenderer from './audio';
import ImageRenderer from './image';
import VideoRenderer from './video';

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
