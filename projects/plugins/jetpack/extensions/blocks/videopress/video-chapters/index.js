const VIDEOPRESS_VIDEO_CHAPTERS_FEATURE = 'videopress/video-chapters';

export const isVideoChaptersEnabled = !! window?.Jetpack_Editor_Initial_State?.available_blocks[
	VIDEOPRESS_VIDEO_CHAPTERS_FEATURE
];
