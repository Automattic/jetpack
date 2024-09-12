/**
 * External dependencies
 */
import { action } from '@storybook/addon-actions';
/**
 * Internal dependencies
 */
import VideoThumbnail, { VideoThumbnailDropdown } from '..';
import { postersArray, randomPoster } from '../../../mock';
import styles from './style.module.scss';
/**
 * Types
 */
import type { StoryFn, Meta } from '@storybook/react';

export default {
	title: 'Packages/VideoPress/Video Thumbnail',
	component: VideoThumbnail,
	parameters: {
		layout: 'centered',
	},
	argTypes: {
		thumbnail: {
			control: { type: 'select' },
			options: [ ...postersArray, 'none' ],
		},
	},
	decorators: [
		Story => (
			<div className={ styles.decorator }>
				<Story />
			</div>
		),
	],
} as Meta< typeof VideoThumbnail >;

const VideoThumbnailTemplate: StoryFn< typeof VideoThumbnail > = ( { thumbnail, ...args } ) => {
	if ( thumbnail === 'none' ) {
		thumbnail = false;
	}

	return <VideoThumbnail { ...args } thumbnail={ thumbnail } />;
};

export const Default = VideoThumbnailTemplate.bind( {} );
Default.args = {
	thumbnail: randomPoster(),
	onUseDefaultThumbnail: action( 'onUseDefaultThumbnail' ),
	onSelectFromVideo: action( 'onSelectFromVideo' ),
	onUploadImage: action( 'onUploadImage' ),
	editable: true,
	loading: false,
	uploading: false,
	processing: false,
	uploadProgress: 0.5,
};

export const Placeholder = VideoThumbnailTemplate.bind( {} );
Placeholder.args = {
	...Default.args,
	thumbnail: 'none',
};

const VideoThumbnailDropdownTemplate: StoryFn< typeof VideoThumbnailDropdown > =
	VideoThumbnailDropdown;

export const VideoDropdown = VideoThumbnailDropdownTemplate.bind( {} );
VideoDropdown.args = {
	onUseDefaultThumbnail: action( 'onUseDefaultThumbnail' ),
	onSelectFromVideo: action( 'onSelectFromVideo' ),
	onUploadImage: action( 'onUploadImage' ),
};
