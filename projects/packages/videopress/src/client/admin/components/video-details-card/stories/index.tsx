/**
 * Internal dependencies
 */
import VideoDetailsCard from '..';
import Doc from './VideoDetailsCard.mdx';
import thumbnail from './video-thumbnail.png';
/**
 * Last imports
 */
import type { ComponentStory, ComponentMeta } from '@storybook/react';

export default {
	title: 'Packages/VideoPress/Video Details Card',
	component: VideoDetailsCard,
	parameters: {
		docs: {
			page: Doc,
		},
	},
} as ComponentMeta< typeof VideoDetailsCard >;

const noop = () => {
	//
};

const Template: ComponentStory< typeof VideoDetailsCard > = args => {
	return <VideoDetailsCard { ...args } onSelectFiles={ noop } />;
};

export const _default = Template.bind( {} );
_default.args = {
	thumbnail,
	filename: 'video-thumbnail.png',
	src: 'https://videos.files.wordpress.com/fx123456B/video-thumbnail.mov',
};
