/**
 * External dependencies
 */
import { action } from '@storybook/addon-actions';
/**
 * Internal dependencies
 */
import {
	VideoCard as VideoCardComponent,
	VideoDetails as VideoDetailsComponent,
	VideoThumbnail as VideoThumbnailComponent,
	VideoThumbnailDropdown as VideoThumbnailDropdownComponent,
} from '..';
import { postersArray, randomPoster } from '../../../mock';
import Doc from './VideoCard.mdx';
/**
 * Types
 */
import type { ComponentStory, ComponentMeta } from '@storybook/react';

export default {
	title: 'Packages/VideoPress/Video Card',
	component: VideoCardComponent,
	parameters: {
		docs: {
			page: Doc,
		},
	},
	argTypes: {
		thumbnail: {
			control: { type: 'select', options: [ ...postersArray, 'none' ] },
		},
	},
} as ComponentMeta< typeof VideoCardComponent >;

const Template: ComponentStory< typeof VideoCardComponent > = args => {
	if ( args.thumbnail === 'none' ) {
		args.thumbnail = null;
	}

	return <VideoCardComponent { ...args } />;
};

export const _default = Template.bind( {} );
_default.args = {
	title: 'JPD Meetup - Barcelona',
	thumbnail: randomPoster(),
	editable: false,
	duration: ( 34 * 60 + 25 ) * 1000, // 34 minutes and 25 seconds
	plays: 972,
	onVideoDetailsClick: action( 'onVideoDetailsClick' ),
	onUpdateThumbnailClick: action( 'onUpdateThumbnailClick' ),
	onUpdateUpdatePrivacyClick: action( 'onUpdateUpdatePrivacyClick' ),
	onDeleteClick: action( 'onDeleteClick' ),
};

const VideoDetailsTemplate: ComponentStory< typeof VideoDetailsComponent > = VideoDetailsComponent;

export const VideoDetails = VideoDetailsTemplate.bind( {} );
VideoDetails.args = {
	filename: 'video-thumbnail.png',
	src: 'https://videos.files.wordpress.com/fx123456B/video-thumbnail.mov',
};

const VideoThumbnailTemplate: ComponentStory< typeof VideoThumbnailComponent > = args => {
	if ( args.thumbnail === 'none' ) {
		args.thumbnail = null;
	}

	return <VideoThumbnailComponent { ...args } />;
};

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
