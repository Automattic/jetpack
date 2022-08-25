/**
 * External dependencies
 */
import { action } from '@storybook/addon-actions';
/**
 * Internal dependencies
 */
import VideoDetailsCard from '..';
import Doc from './VideoDetailsCard.mdx';
import thumbnail from './video-thumbnail.png';
/**
 * Types
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

const Template: ComponentStory< typeof VideoDetailsCard > = VideoDetailsCard;

export const _default = Template.bind( {} );
_default.args = {
	thumbnail,
	filename: 'video-thumbnail.png',
	src: 'https://videos.files.wordpress.com/fx123456B/video-thumbnail.mov',
	onUseDefaultThumbnail: action( 'onUseDefaultThumbnail' ),
	onSelectFromVideo: action( 'onSelectFromVideo' ),
	onUploadImage: action( 'onUploadImage' ),
};
