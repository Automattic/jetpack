/**
 * External dependencies
 */
import { action } from '@storybook/addon-actions';
/**
 * Internal dependencies
 */
import VideoThumbnail, { VideoThumbnailDropdown } from '..';
import { randomPoster } from '../../../mock';
import styles from './style.module.scss';
/**
 * Types
 */
import type { ComponentStory, ComponentMeta } from '@storybook/react';

export default {
	title: 'Packages/VideoPress/Video Thumbnail',
	component: VideoThumbnail,
	parameters: {
		layout: 'centered',
	},
	decorators: [
		Story => (
			<div className={ styles.decorator }>
				<Story />
			</div>
		),
	],
} as ComponentMeta< typeof VideoThumbnail >;

const VideoThumbnailTemplate: ComponentStory< typeof VideoThumbnail > = args => {
	if ( args.thumbnail === 'none' ) {
		args.thumbnail = null;
	}

	return <VideoThumbnail { ...args } />;
};

export const Default = VideoThumbnailTemplate.bind( {} );
Default.args = {
	thumbnail: randomPoster(),
	onUseDefaultThumbnail: action( 'onUseDefaultThumbnail' ),
	onSelectFromVideo: action( 'onSelectFromVideo' ),
	onUploadImage: action( 'onUploadImage' ),
	editable: true,
};

const VideoThumbnailDropdownTemplate: ComponentStory<
	typeof VideoThumbnailDropdown
> = VideoThumbnailDropdown;

export const VideoDropdown = VideoThumbnailDropdownTemplate.bind( {} );
VideoDropdown.args = {
	onUseDefaultThumbnail: action( 'onUseDefaultThumbnail' ),
	onSelectFromVideo: action( 'onSelectFromVideo' ),
	onUploadImage: action( 'onUploadImage' ),
};
