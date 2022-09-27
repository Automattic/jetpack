/**
 * External dependencies
 */
import { action } from '@storybook/addon-actions';
/**
 * Internal dependencies
 */
import { VideoCard as VideoCardComponent } from '..';
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
		layout: 'centered',
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
	onUpdateVideoThumbnail: action( 'onUpdateVideoThumbnail' ),
	onUpdateVideoPrivacy: action( 'onUpdateVideoPrivacy' ),
	onDeleteVideo: action( 'onDeleteVideo' ),
	showQuickActions: true,
};
