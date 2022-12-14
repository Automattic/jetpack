/**
 * Internal dependencies
 */
import VideoDetails from '..';
/**
 * Types
 */
import type { ComponentStory, ComponentMeta } from '@storybook/react';

export default {
	title: 'Packages/VideoPress/Video Details',
	component: VideoDetails,
} as ComponentMeta< typeof VideoDetails >;

const VideoDetailsTemplate: ComponentStory< typeof VideoDetails > = VideoDetails;

export const Default = VideoDetailsTemplate.bind( {} );
Default.args = {
	filename: 'video-thumbnail.png',
	src: 'https://videos.files.wordpress.com/fx123456B/video-thumbnail.mov',
};
