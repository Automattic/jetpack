/**
 * External dependencies
 */
import React from 'react';

/**
 * Internal dependencies
 */
import Gridicon from './gridicon';
import arrayOverlap from '../lib/array-overlap';

const KNOWN_SHORTCODE_TYPES = {
	video: [
		'youtube',
		'ooyala',
		'anvplayer',
		'wpvideo',
		'bc_video',
		'video',
		'brightcove',
		'tp_video',
		'jwplayer',
		'tempo-video',
		'vimeo',
	],
	gallery: [ 'gallery', 'ione_media_gallery' ],
	audio: [ 'audio', 'soundcloud' ],
};

const POST_TYPE_TO_ICON_MAP = {
	product: 'cart',
	video: 'video',
	gallery: 'image-multiple',
	event: 'calendar',
	events: 'calendar',
};

const PostTypeIcon = ( { postType, shortcodeTypes, iconSize = 18 } ) => {
	// Do we have a special icon for this post type?
	if ( Object.keys( POST_TYPE_TO_ICON_MAP ).includes( postType ) ) {
		return <Gridicon icon={ POST_TYPE_TO_ICON_MAP[ postType ] } size={ iconSize } />;
	}

	// Otherwise, choose the icon based on whether the post has certain shortcodes
	const hasVideo = arrayOverlap( shortcodeTypes, KNOWN_SHORTCODE_TYPES.video );
	const hasAudio = arrayOverlap( shortcodeTypes, KNOWN_SHORTCODE_TYPES.audio );
	const hasGallery = arrayOverlap( shortcodeTypes, KNOWN_SHORTCODE_TYPES.gallery );

	if ( hasVideo ) {
		return <Gridicon icon="video" size={ iconSize } />;
	} else if ( hasAudio ) {
		return <Gridicon icon="audio" size={ iconSize } />;
	}

	switch ( postType ) {
		case 'page':
			return <Gridicon icon="pages" size={ iconSize } />;
		default:
			if ( hasGallery ) {
				return <Gridicon icon="image-multiple" size={ iconSize } />;
			}
	}

	return null;
};

export default PostTypeIcon;
