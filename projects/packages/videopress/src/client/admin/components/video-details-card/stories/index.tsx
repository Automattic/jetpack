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
	thumbnail,
	onUseDefaultThumbnail: action( 'onUseDefaultThumbnail' ),
	onSelectFromVideo: action( 'onSelectFromVideo' ),
	onUploadImage: action( 'onUploadImage' ),
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
