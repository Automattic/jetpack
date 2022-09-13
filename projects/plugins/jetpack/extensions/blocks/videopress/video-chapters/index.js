const VIDEOPRESS_VIDEO_CHAPTERS_FEATURE = 'videopress/video-chapters';

export const isVideoChaptersEnabled = !! window?.Jetpack_Editor_Initial_State?.available_blocks[
	VIDEOPRESS_VIDEO_CHAPTERS_FEATURE
];

export default function addVideoPressVideoChaptersSupport( settings, name ) {
	if ( isVideoChaptersEnabled ) {
		return settings;
	}

	if ( name !== 'core/video' ) {
		return settings;
	}

	return {
		...settings,
		attributes: {
			...settings.attributes,
			title: {
				type: 'string',
			},
			description: {
				type: 'string',
			},
		},
	};
}
