/**
 * Internal dependencies
 */
import VideoDetails from '..';
/**
 * Types
 */
import type { StoryFn, Meta } from '@storybook/react';

export default {
	title: 'Packages/VideoPress/Video Details',
	component: VideoDetails,
} as Meta< typeof VideoDetails >;

const VideoDetailsTemplate: StoryFn< typeof VideoDetails > = VideoDetails;

export const Default = VideoDetailsTemplate.bind( {} );
Default.args = {
	guid: 'ezoR6kzb',
	filename: 'video-thumbnail.png',
	src: 'https://videos.files.wordpress.com/fx123456B/video-thumbnail.mov',
	isPrivate: false,
};
