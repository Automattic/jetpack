/**
 * External dependencies
 */
import { action } from '@storybook/addon-actions';
/**
 * Internal dependencies
 */
import VideoDetailsCard, {
	VideoDetails as VideoDetailsComponent,
	VideoThumbnail as VideoThumbnailComponent,
	VideoThumbnailDropdown as VideoThumbnailDropdownComponent,
} from '..';
import { postersArray, randomPoster } from '../../../mock/';
import Doc from './VideoDetailsCard.mdx';
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
	argTypes: {
		thumbnail: {
			control: { type: 'select', options: postersArray },
		},
	},
} as ComponentMeta< typeof VideoDetailsCard >;

const Template: ComponentStory< typeof VideoDetailsCard > = VideoDetailsCard;

export const _default = Template.bind( {} );
_default.args = {
	thumbnail: randomPoster(),
	filename: 'video-thumbnail.png',
	src: 'https://videos.files.wordpress.com/fx123456B/video-thumbnail.mov',
	onUseDefaultThumbnail: action( 'onUseDefaultThumbnail' ),
	onSelectFromVideo: action( 'onSelectFromVideo' ),
	onUploadImage: action( 'onUploadImage' ),
	editable: true,
	duration: ( 4 * 60 + 20 ) * 1000, // 4 minutes and 20 seconds
};

const VideoDetailsTemplate: ComponentStory< typeof VideoDetailsComponent > = VideoDetailsComponent;

export const VideoDetails = VideoDetailsTemplate.bind( {} );
VideoDetails.args = {
	filename: 'video-thumbnail.png',
	src: 'https://videos.files.wordpress.com/fx123456B/video-thumbnail.mov',
};

const VideoThumbnailTemplate: ComponentStory<
	typeof VideoThumbnailComponent
> = VideoThumbnailComponent;

export const VideoThumbnail = VideoThumbnailTemplate.bind( {} );
VideoThumbnail.args = {
	thumbnail: randomPoster(),
	onUseDefaultThumbnail: action( 'onUseDefaultThumbnail' ),
	onSelectFromVideo: action( 'onSelectFromVideo' ),
	onUploadImage: action( 'onUploadImage' ),
	editable: true,
};

const VideoThumbnailDropdownTemplate: ComponentStory<
	typeof VideoThumbnailDropdownComponent
> = VideoThumbnailDropdownComponent;

export const VideoDropdown = VideoThumbnailDropdownTemplate.bind( {} );
VideoDropdown.args = {
	onUseDefaultThumbnail: action( 'onUseDefaultThumbnail' ),
	onSelectFromVideo: action( 'onSelectFromVideo' ),
	onUploadImage: action( 'onUploadImage' ),
};
