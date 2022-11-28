/**
 * Internal dependencies
 */
import withVideoChaptersEdit from './edit';

const VIDEOPRESS_VIDEO_CHAPTERS_FEATURE = 'videopress/video-chapters';

export const isVideoChaptersEnabled = !! window?.Jetpack_Editor_Initial_State?.available_blocks[
	VIDEOPRESS_VIDEO_CHAPTERS_FEATURE
];

export default function addVideoPressVideoChaptersSupport( settings, name ) {
	if ( ! isVideoChaptersEnabled ) {
		return settings;
	}

	if ( name !== 'core/video' ) {
		return settings;
	}

	const videoChaptersAttributes = {
		...settings.attributes,
		title: {
			type: 'string',
		},
		description: {
			type: 'string',
		},
	};

	return {
		...settings,
		attributes: videoChaptersAttributes,
		edit: withVideoChaptersEdit( settings.edit ),
	};
}
